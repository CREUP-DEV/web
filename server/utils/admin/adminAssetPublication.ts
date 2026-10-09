import type { H3Event } from 'h3'
import { and, eq, isNull, sql, type SQLWrapper } from 'drizzle-orm'
import { db } from '../../db'
import {
  aboutPageContent,
  carouselItems,
  equalityDocuments,
  featuredLinks,
  financialReports,
  newsletterCampaignItems,
  pressArticles,
} from '../../db/schema'
import { isDatabaseMissingRelationError, isDatabaseUnavailableError } from '../core/databaseErrors'
import { finalizeAdminDocument } from './adminDocumentUpload'
import { finalizeAdminImage } from './adminImageUpload'
import { hasAdminStoredFileReference } from './adminAssetReferences'
import {
  deleteAdminStoredFile,
  isTemporaryAdminStoragePath,
  normalizeAdminStoredPath,
  restoreAdminStoredFileToTemporaryPath,
} from './adminStoredFile'
import { logError, logWarn } from '../core/logger'
import { getDefaultAdminApiErrorMessage } from '../locale/adminApiErrorMessages'
import {
  ABOUT_HERO_DEFAULT_IMAGE,
  ABOUT_IMAGE_PUBLIC_PATH,
  EQUALITY_DOCUMENTS_PUBLIC_PATH,
  FINANCIAL_REPORTS_PUBLIC_PATH,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
  PRESS_DOCUMENT_PUBLIC_PATH,
  PRESS_IMAGE_PUBLIC_BASE,
} from '~~/shared/constants/assetPaths'

export interface CleanupUnusedAdminAssetOptions {
  storagePath: string | null | undefined
  allowedPublicPathPrefixes: string[]
  protectedPublicPaths?: string[]
  /**
   * Set by `trackAdminAssetFinalization` when the file was moved out of the temporary store: the
   * rollback moves it back there instead of deleting it, so the form can be resubmitted.
   */
  restoreToTemporaryStoragePath?: string
}

export async function cleanupUnusedAdminAsset(options: CleanupUnusedAdminAssetOptions) {
  const normalizedStoragePath = options.storagePath?.trim()

  if (!normalizedStoragePath) {
    return false
  }

  if (options.protectedPublicPaths?.includes(normalizedStoragePath)) {
    return false
  }

  if (await hasAdminStoredFileReference(normalizedStoragePath)) {
    return false
  }

  return deleteAdminStoredFile({
    storagePath: normalizedStoragePath,
    allowedPublicPathPrefixes: options.allowedPublicPathPrefixes,
    protectedPublicPaths: options.protectedPublicPaths,
  })
}

export async function cleanupUnusedAdminAssetSafely(
  options: CleanupUnusedAdminAssetOptions,
  scope: string,
  event?: H3Event
) {
  try {
    return await cleanupUnusedAdminAsset(options)
  } catch (error) {
    logError(scope, error, { ...options }, event)
    return false
  }
}

/**
 * Records a file `finalizeAdminImage` / `finalizeAdminDocument` just produced, so a failed save can
 * undo it with `cleanupAdminAssetFinalizationsSafely`. Call it right after each finalize, inside the
 * same try as the transaction.
 */
export function trackAdminAssetFinalization(
  targets: CleanupUnusedAdminAssetOptions[],
  options: CleanupUnusedAdminAssetOptions & { sourceStoragePath?: string | null | undefined }
) {
  const sourceStoragePath = options.sourceStoragePath?.trim()
  const finalizedStoragePath = options.storagePath?.trim()

  if (!sourceStoragePath || !finalizedStoragePath || sourceStoragePath === finalizedStoragePath) {
    return false
  }

  targets.push({
    storagePath: finalizedStoragePath,
    allowedPublicPathPrefixes: [...options.allowedPublicPathPrefixes],
    protectedPublicPaths: options.protectedPublicPaths
      ? [...options.protectedPublicPaths]
      : undefined,
    restoreToTemporaryStoragePath: isTemporaryAdminStoragePath(sourceStoragePath)
      ? normalizeAdminStoredPath(sourceStoragePath)
      : undefined,
  })

  return true
}

async function rollbackAdminAssetFinalization(target: CleanupUnusedAdminAssetOptions) {
  const storagePath = target.storagePath?.trim()
  const temporaryStoragePath = target.restoreToTemporaryStoragePath

  if (!temporaryStoragePath || !storagePath) {
    return cleanupUnusedAdminAsset(target)
  }

  if (
    target.protectedPublicPaths?.includes(storagePath) ||
    (await hasAdminStoredFileReference(storagePath))
  ) {
    return false
  }

  try {
    await restoreAdminStoredFileToTemporaryPath(storagePath, temporaryStoragePath)
  } catch (error) {
    // Losing the upload is better than leaving an unreferenced file in a public folder: the
    // editor can upload it again.
    logWarn('admin-assets.rollback.restore-failed', { storagePath, temporaryStoragePath, error })
  }

  return deleteAdminStoredFile({
    storagePath,
    allowedPublicPathPrefixes: target.allowedPublicPathPrefixes,
    protectedPublicPaths: target.protectedPublicPaths,
  })
}

/**
 * Undoes the finalizations of a failed save, newest first. A file moved out of the temporary store
 * goes back to its temporary path (the form still holds it, so a resubmit works); a copy of an
 * already stored file is deleted (the original was never touched). Anything a committed row
 * references is left alone.
 */
export async function cleanupAdminAssetFinalizationsSafely(
  targets: CleanupUnusedAdminAssetOptions[],
  scope: string,
  event?: H3Event
) {
  for (const target of [...targets].reverse()) {
    try {
      await rollbackAdminAssetFinalization(target)
    } catch (error) {
      logError(scope, error, { ...target }, event)
    }
  }
}

function matchesStoredPath(column: SQLWrapper, storagePath: string | null) {
  return storagePath === null ? isNull(column) : eq(column, storagePath)
}

interface ReconciledPath {
  previous: string | null
  next: string | null
  allowedPublicPathPrefixes: string[]
  protectedPublicPaths?: string[]
}

/**
 * Finishes a reconcile write. `applied` says whether the row was repointed: the UPDATE only matches
 * while the row still holds the paths that were reconciled, because an admin save may have
 * replaced them in the meantime. When it was, the superseded files go; when it was not, the copies
 * made for it go instead. Either way only files nothing references are deleted.
 */
async function settleReconciledPaths(applied: boolean, paths: ReconciledPath[]) {
  for (const path of paths) {
    if (path.previous === path.next) {
      continue
    }

    await cleanupUnusedAdminAsset({
      storagePath: applied ? path.previous : path.next,
      allowedPublicPathPrefixes: path.allowedPublicPathPrefixes,
      protectedPublicPaths: path.protectedPublicPaths,
    })
  }
}

/** Runs a conditional reconcile UPDATE and settles its files. Returns whether the row matched. */
async function applyReconciledPaths(update: () => Promise<unknown[]>, paths: ReconciledPath[]) {
  let applied: boolean

  try {
    applied = (await update()).length > 0
  } catch (error) {
    await settleReconciledPaths(false, paths).catch((cleanupError) => {
      logWarn('admin-assets.reconcile.rollback-failed', { error: cleanupError })
    })
    throw error
  }

  await settleReconciledPaths(applied, paths)
  return applied
}

function isAssetUnavailableError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    error.statusCode === 400 &&
    'message' in error &&
    error.message === getDefaultAdminApiErrorMessage('assetUnavailable')
  )
}

async function reconcileStoredImage(options: {
  storagePath: string | null | undefined
  publish: boolean
  uploadDir: string
  publicPath: string
  protectedPublicPaths?: string[]
}) {
  const normalizedStoragePath = options.storagePath?.trim()

  if (!normalizedStoragePath || options.protectedPublicPaths?.includes(normalizedStoragePath)) {
    return normalizedStoragePath ?? null
  }

  try {
    return await finalizeAdminImage({
      storagePath: normalizedStoragePath,
      uploadDir: options.uploadDir,
      publicPath: options.publicPath,
      publish: options.publish,
      protectedPublicPaths: options.protectedPublicPaths,
    })
  } catch (error) {
    if (isAssetUnavailableError(error)) {
      return normalizedStoragePath
    }

    throw error
  }
}

async function reconcileStoredDocument(options: {
  storagePath: string | null | undefined
  publish: boolean
  uploadDir: string
  publicPath: string
}) {
  const normalizedStoragePath = options.storagePath?.trim()

  if (!normalizedStoragePath) {
    return null
  }

  try {
    return await finalizeAdminDocument({
      storagePath: normalizedStoragePath,
      uploadDir: options.uploadDir,
      publicPath: options.publicPath,
      publish: options.publish,
    })
  } catch (error) {
    if (isAssetUnavailableError(error)) {
      return normalizedStoragePath
    }

    throw error
  }
}

/**
 * Every image path frozen into a campaign snapshot, across all campaigns and locales.
 *
 * Computed once, before anything is reconciled, and not as a branch inside the loops: the whole
 * point is that the outcome cannot depend on the order entities are visited, so a file is never
 * moved to inactive storage only to be published again two iterations later.
 */
async function loadSnapshotProtectedAssetPaths(): Promise<Set<string>> {
  const result = await db.execute<{ path: string | null }>(
    sql`SELECT DISTINCT jsonb_array_elements_text(${newsletterCampaignItems.snapshot} -> 'assetPaths') AS path
        FROM ${newsletterCampaignItems}
        WHERE ${newsletterCampaignItems.snapshot} IS NOT NULL`
  )

  return new Set(
    result.rows.flatMap((row) => {
      const path = row.path?.trim()
      return path ? [path] : []
    })
  )
}

/** Returns whether any stored path was rewritten, so the caller can purge the public caches. */
export async function reconcileAdminAssetPublication(): Promise<boolean> {
  let changed = false

  try {
    // Preventing the deletion of these files is a different mechanism (`adminAssetReferences`) and
    // it is not enough on its own: unpublishing the piece that owns an image would move the file to
    // inactive storage, and the email already delivered would lose it. So a snapshotted path counts
    // as published here regardless of what its own entity says.
    const snapshotProtectedPaths = await loadSnapshotProtectedAssetPaths()
    const isSnapshotProtected = (storagePath: string | null | undefined) =>
      Boolean(storagePath && snapshotProtectedPaths.has(storagePath.trim()))

    const [
      carouselItemsList,
      featuredLinksList,
      pressArticlesList,
      aboutContent,
      equalityDocumentsList,
      financialReportsList,
    ] = await Promise.all([
      db.query.carouselItems.findMany({ columns: { id: true, image: true, active: true } }),
      db.query.featuredLinks.findMany({ columns: { id: true, image: true, active: true } }),
      db.query.pressArticles.findMany({
        columns: { id: true, image: true, pdfUrl: true, active: true },
      }),
      db.query.aboutPageContent.findFirst({
        columns: { id: true, heroImage: true, heroVisible: true },
      }),
      db.query.equalityDocuments.findMany({
        columns: { id: true, pdfUrl: true, active: true },
      }),
      db.query.financialReports.findMany({
        columns: { id: true, pdfUrl: true, active: true },
      }),
    ])

    for (const item of carouselItemsList) {
      if (!item.image?.trim()) {
        continue
      }

      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active || isSnapshotProtected(item.image),
        uploadDir: 'public/inicio/imagenes/carrusel',
        publicPath: HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
      })

      if (nextImage && nextImage !== item.image) {
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(carouselItems)
              .set({ image: nextImage })
              .where(
                and(
                  eq(carouselItems.id, item.id),
                  matchesStoredPath(carouselItems.image, item.image)
                )
              )
              .returning({ id: carouselItems.id }),
          [
            {
              previous: item.image,
              next: nextImage,
              allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
            },
          ]
        )
        if (applied) changed = true
      }
    }

    for (const item of featuredLinksList) {
      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active || isSnapshotProtected(item.image),
        uploadDir: 'public/inicio/imagenes/enlaces-destacados',
        publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
      })

      if (nextImage && nextImage !== item.image) {
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(featuredLinks)
              .set({ image: nextImage })
              .where(
                and(
                  eq(featuredLinks.id, item.id),
                  matchesStoredPath(featuredLinks.image, item.image)
                )
              )
              .returning({ id: featuredLinks.id }),
          [
            {
              previous: item.image,
              next: nextImage,
              allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
            },
          ]
        )
        if (applied) changed = true
      }
    }

    for (const item of pressArticlesList) {
      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active || isSnapshotProtected(item.image),
        uploadDir: 'public/prensa/imagenes',
        publicPath: PRESS_IMAGE_PUBLIC_BASE,
      })
      const nextPdfUrl = await reconcileStoredDocument({
        storagePath: item.pdfUrl,
        publish: item.active,
        uploadDir: 'public/prensa/documentos',
        publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
      })

      if (nextImage !== item.image || nextPdfUrl !== item.pdfUrl) {
        const image = nextImage ?? item.image
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(pressArticles)
              .set({ image, pdfUrl: nextPdfUrl })
              .where(
                and(
                  eq(pressArticles.id, item.id),
                  matchesStoredPath(pressArticles.image, item.image),
                  matchesStoredPath(pressArticles.pdfUrl, item.pdfUrl)
                )
              )
              .returning({ id: pressArticles.id }),
          [
            {
              previous: item.image,
              next: image,
              allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
            },
            {
              previous: item.pdfUrl,
              next: nextPdfUrl,
              allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
            },
          ]
        )
        if (applied) changed = true
      }
    }

    if (aboutContent?.id) {
      const nextHeroImage = await reconcileStoredImage({
        storagePath: aboutContent.heroImage,
        publish: aboutContent.heroVisible || isSnapshotProtected(aboutContent.heroImage),
        uploadDir: 'public/conocenos/imagenes',
        publicPath: ABOUT_IMAGE_PUBLIC_PATH,
        protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
      })

      if (nextHeroImage !== aboutContent.heroImage) {
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(aboutPageContent)
              .set({ heroImage: nextHeroImage })
              .where(
                and(
                  eq(aboutPageContent.id, aboutContent.id),
                  matchesStoredPath(aboutPageContent.heroImage, aboutContent.heroImage)
                )
              )
              .returning({ id: aboutPageContent.id }),
          [
            {
              previous: aboutContent.heroImage,
              next: nextHeroImage,
              allowedPublicPathPrefixes: [ABOUT_IMAGE_PUBLIC_PATH],
              protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
            },
          ]
        )
        if (applied) changed = true
      }
    }

    for (const item of equalityDocumentsList) {
      const nextPdfUrl = await reconcileStoredDocument({
        storagePath: item.pdfUrl,
        publish: item.active,
        uploadDir: 'public/documentos/igualdad',
        publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
      })

      if (nextPdfUrl !== item.pdfUrl) {
        const pdfUrl = nextPdfUrl ?? item.pdfUrl
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(equalityDocuments)
              .set({ pdfUrl })
              .where(
                and(
                  eq(equalityDocuments.id, item.id),
                  matchesStoredPath(equalityDocuments.pdfUrl, item.pdfUrl)
                )
              )
              .returning({ id: equalityDocuments.id }),
          [
            {
              previous: item.pdfUrl,
              next: pdfUrl,
              allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
            },
          ]
        )
        if (applied) changed = true
      }
    }

    for (const item of financialReportsList) {
      const nextPdfUrl = await reconcileStoredDocument({
        storagePath: item.pdfUrl,
        publish: item.active,
        uploadDir: 'public/documentos/informes-economicos',
        publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
      })

      if (nextPdfUrl !== item.pdfUrl) {
        const pdfUrl = nextPdfUrl ?? item.pdfUrl
        const applied = await applyReconciledPaths(
          () =>
            db
              .update(financialReports)
              .set({ pdfUrl })
              .where(
                and(
                  eq(financialReports.id, item.id),
                  matchesStoredPath(financialReports.pdfUrl, item.pdfUrl)
                )
              )
              .returning({ id: financialReports.id }),
          [
            {
              previous: item.pdfUrl,
              next: pdfUrl,
              allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
            },
          ]
        )
        if (applied) changed = true
      }
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logWarn('admin-assets.reconcile.database-unavailable')
      return changed
    }

    if (isDatabaseMissingRelationError(error, 'newsletter_campaign_items')) {
      logWarn('admin-assets.reconcile.missing-relation', { relation: 'newsletter_campaign_items' })
      return changed
    }

    logError('admin-assets.reconcile', error)
  }

  return changed
}
