import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import {
  aboutPageContent,
  carouselItems,
  equalityDocuments,
  featuredLinks,
  financialReports,
  newsletters,
  pressArticles,
  pressDossier,
} from '../db/schema'
import { isDatabaseMissingRelationError, isDatabaseUnavailableError } from './databaseErrors'
import { finalizeAdminDocument } from './adminDocumentUpload'
import { finalizeAdminImage } from './adminImageUpload'
import { hasAdminStoredFileReference } from './adminAssetReferences'
import { deleteAdminStoredFile } from './adminStoredFile'
import { logError, logWarn } from './logger'
import {
  ABOUT_HERO_DEFAULT_IMAGE,
  ABOUT_IMAGE_PUBLIC_PATH,
  EQUALITY_DOCUMENTS_PUBLIC_PATH,
  FINANCIAL_REPORTS_PUBLIC_PATH,
  HOME_CAROUSEL_FALLBACK_IMAGE,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
  PRESS_DOCUMENT_PUBLIC_PATH,
  PRESS_DOSSIER_PUBLIC_PATH,
  PRESS_IMAGE_PUBLIC_BASE,
} from '~~/shared/constants/assetPaths'

export interface CleanupUnusedAdminAssetOptions {
  storagePath: string | null | undefined
  allowedPublicPathPrefixes: string[]
  protectedPublicPaths?: string[]
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
  })

  return true
}

export async function cleanupAdminAssetFinalizationsSafely(
  targets: CleanupUnusedAdminAssetOptions[],
  scope: string,
  event?: H3Event
) {
  for (const target of [...targets].reverse()) {
    await cleanupUnusedAdminAssetSafely(target, scope, event)
  }
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
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 400 &&
      'message' in error &&
      error.message === 'El archivo ya no está disponible'
    ) {
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
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 400 &&
      'message' in error &&
      error.message === 'El archivo ya no está disponible'
    ) {
      return normalizedStoragePath
    }

    throw error
  }
}

export async function reconcileAdminAssetPublication() {
  try {
    const [
      carouselItemsList,
      featuredLinksList,
      pressArticlesList,
      pressDossierItem,
      newslettersList,
      aboutContent,
      equalityDocumentsList,
      financialReportsList,
    ] = await Promise.all([
      db.query.carouselItems.findMany({ columns: { id: true, image: true, active: true } }),
      db.query.featuredLinks.findMany({ columns: { id: true, image: true, active: true } }),
      db.query.pressArticles.findMany({
        columns: { id: true, image: true, pdfUrl: true, active: true },
      }),
      db.query.pressDossier.findFirst({ columns: { id: true, pdfUrl: true, active: true } }),
      db.query.newsletters.findMany({
        columns: { id: true, coverImage: true, pdfUrl: true, publicVisible: true },
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
      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active,
        uploadDir: 'public/inicio/imagenes/carrusel',
        publicPath: HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
        protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
      })

      if (nextImage && nextImage !== item.image) {
        await db
          .update(carouselItems)
          .set({ image: nextImage })
          .where(eq(carouselItems.id, item.id))
        await cleanupUnusedAdminAsset({
          storagePath: item.image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        })
      }
    }

    for (const item of featuredLinksList) {
      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active,
        uploadDir: 'public/inicio/imagenes/enlaces-destacados',
        publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
      })

      if (nextImage && nextImage !== item.image) {
        await db
          .update(featuredLinks)
          .set({ image: nextImage })
          .where(eq(featuredLinks.id, item.id))
        await cleanupUnusedAdminAsset({
          storagePath: item.image,
          allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
        })
      }
    }

    for (const item of pressArticlesList) {
      const nextImage = await reconcileStoredImage({
        storagePath: item.image,
        publish: item.active,
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
        await db
          .update(pressArticles)
          .set({
            image: nextImage ?? item.image,
            pdfUrl: nextPdfUrl,
          })
          .where(eq(pressArticles.id, item.id))

        await cleanupUnusedAdminAsset({
          storagePath: item.image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
        await cleanupUnusedAdminAsset({
          storagePath: item.pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        })
      }
    }

    if (pressDossierItem?.id) {
      const nextPdfUrl = await reconcileStoredDocument({
        storagePath: pressDossierItem.pdfUrl,
        publish: pressDossierItem.active,
        uploadDir: 'public/prensa/dossier',
        publicPath: PRESS_DOSSIER_PUBLIC_PATH,
      })

      if (nextPdfUrl !== pressDossierItem.pdfUrl) {
        await db
          .update(pressDossier)
          .set({ pdfUrl: nextPdfUrl })
          .where(eq(pressDossier.id, pressDossierItem.id))

        await cleanupUnusedAdminAsset({
          storagePath: pressDossierItem.pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOSSIER_PUBLIC_PATH],
        })
      }
    }

    for (const item of newslettersList) {
      const nextCoverImage = await reconcileStoredImage({
        storagePath: item.coverImage,
        publish: item.publicVisible,
        uploadDir: 'public/prensa/newsletter/portadas',
        publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
      })
      const nextPdfUrl = await reconcileStoredDocument({
        storagePath: item.pdfUrl,
        publish: item.publicVisible,
        uploadDir: 'public/prensa/newsletter/documentos',
        publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
      })

      if (nextCoverImage !== item.coverImage || nextPdfUrl !== item.pdfUrl) {
        await db
          .update(newsletters)
          .set({
            coverImage: nextCoverImage ?? item.coverImage,
            pdfUrl: nextPdfUrl ?? item.pdfUrl,
          })
          .where(eq(newsletters.id, item.id))

        await cleanupUnusedAdminAsset({
          storagePath: item.coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        })
        await cleanupUnusedAdminAsset({
          storagePath: item.pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        })
      }
    }

    if (aboutContent?.id) {
      const nextHeroImage = await reconcileStoredImage({
        storagePath: aboutContent.heroImage,
        publish: aboutContent.heroVisible,
        uploadDir: 'public/conocenos/imagenes',
        publicPath: ABOUT_IMAGE_PUBLIC_PATH,
        protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
      })

      if (nextHeroImage !== aboutContent.heroImage) {
        await db
          .update(aboutPageContent)
          .set({ heroImage: nextHeroImage })
          .where(eq(aboutPageContent.id, aboutContent.id))

        await cleanupUnusedAdminAsset({
          storagePath: aboutContent.heroImage,
          allowedPublicPathPrefixes: [ABOUT_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
        })
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
        await db
          .update(equalityDocuments)
          .set({ pdfUrl: nextPdfUrl ?? item.pdfUrl })
          .where(eq(equalityDocuments.id, item.id))

        await cleanupUnusedAdminAsset({
          storagePath: item.pdfUrl,
          allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
        })
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
        await db
          .update(financialReports)
          .set({ pdfUrl: nextPdfUrl ?? item.pdfUrl })
          .where(eq(financialReports.id, item.id))

        await cleanupUnusedAdminAsset({
          storagePath: item.pdfUrl,
          allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
        })
      }
    }
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logWarn('admin-assets.reconcile.database-unavailable')
      return
    }

    if (isDatabaseMissingRelationError(error, 'newsletters')) {
      logWarn('admin-assets.reconcile.missing-relation', { relation: 'newsletters' })
      return
    }

    logError('admin-assets.reconcile', error)
  }
}
