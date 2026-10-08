import { createError, defineEventHandler, readBody, type H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { ZodType } from 'zod'
import type { db } from '../../db'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from './adminAssetPublication'
import { runAdminCrudTransaction } from './adminCrud'
import { throwAdminMutationError } from './adminErrors'
import {
  type AdminApiErrorMessageKey,
  getAdminApiErrorMessage,
} from '../locale/adminApiErrorMessages'
import { finalizeAdminImage } from './adminImageUpload'
import { assertOptimisticLock, buildExpectedVersionCondition } from './optimisticLock'
import { logError } from '../core/logger'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../validation'

type CrudTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Subset of `finalizeAdminImage` / `finalizeAdminDocument` options the factory drives. */
interface FinalizeAssetOptions {
  storagePath: string
  uploadDir: string
  publicPath: string
  slug?: string
  fallbackBaseName?: string
  replaceStoragePath?: string | null
  publish?: boolean
}

type ColumnValues = Record<string, unknown>

export interface AssetBackedTranslatableCrudConfig<
  TCreate extends object,
  TUpdate extends object,
  TRow,
> {
  schema: {
    create: ZodType<TCreate>
    update: ZodType<TUpdate>
  }
  /**
   * Optional resource-specific assertion run after schema validation and before any asset
   * work. Throw `createError(...)` to reject. Use for checks Zod cannot express in isolation.
   */
  validate?: (validated: TCreate | TUpdate, event: H3Event) => void
  /**
   * Asset finalization. `getSource` returns the incoming temporary storage path from the
   * validated payload (or null when no asset is attached). `finalize` defaults to image
   * finalization; document-backed resources pass `finalizeAdminDocument`.
   */
  asset: {
    uploadDir: string
    publicPath: string
    fallbackBaseName: string
    finalize?: (options: FinalizeAssetOptions) => Promise<string> | string
    getSource: (validated: TCreate | TUpdate) => string | null
    deriveSlug?: (validated: TCreate | TUpdate) => string | undefined
    getPublish?: (validated: TCreate | TUpdate) => boolean | undefined
  }
  main: {
    table: PgTable
    idColumn: PgColumn
    updatedAtColumn: PgColumn
    /** Map validated payload + finalized asset path to the main-table column values. */
    buildValues: (
      validated: TCreate | TUpdate,
      context: { assetPath: string | null; event: H3Event }
    ) => ColumnValues
    /** Load the row touched by an update for the 404 + optimistic-lock + previous-asset checks. */
    loadExisting: (
      id: string
    ) => Promise<{ updatedAt: Date | string | null; asset: string | null } | null>
    refetch: (tx: CrudTx, id: string) => Promise<TRow | null | undefined>
  }
  /** Omit for single-language resources (no translation table). */
  translations?: {
    table: PgTable
    fkColumn: PgColumn
    buildRows: (validated: TCreate | TUpdate, parentId: string) => ColumnValues[]
  }
  invalidate: () => Promise<void> | void
  /** i18n keys resolved per-request via `getAdminApiErrorMessage`. */
  messages: {
    notFound: AdminApiErrorMessageKey
    optimisticLock: AdminApiErrorMessageKey
    createFailed: AdminApiErrorMessageKey
    updateFailed: AdminApiErrorMessageKey
  }
  /** Logging scope prefixes, e.g. `admin.carousel.create` / `admin.carousel.update`. */
  scope: {
    create: string
    update: string
  }
}

export function defineAssetBackedTranslatableCrud<
  TCreate extends object,
  TUpdate extends { updatedAt?: string | null },
  TRow,
>(config: AssetBackedTranslatableCrudConfig<TCreate, TUpdate, TRow>) {
  const { asset, main, translations, messages, scope } = config
  const finalizeAsset = asset.finalize ?? finalizeAdminImage
  const allowedPublicPathPrefixes = [asset.publicPath]

  // Runs after commit: a failure here must not answer 500 for a save that went through (the editor
  // would retry it, duplicating a create).
  const invalidateAfterCommit = async (logScope: string, event: H3Event) => {
    try {
      await config.invalidate()
    } catch (error) {
      logError(`${logScope}.invalidate`, error, undefined, event)
    }
  }

  const finalizeIncomingAsset = async (
    validated: TCreate | TUpdate,
    cleanupTargets: CleanupUnusedAdminAssetOptions[],
    replaceStoragePath?: string | null
  ) => {
    const source = asset.getSource(validated)
    if (!source) {
      return { source: null as string | null, assetPath: null as string | null }
    }

    const assetPath = await finalizeAsset({
      storagePath: source,
      uploadDir: asset.uploadDir,
      publicPath: asset.publicPath,
      slug: asset.deriveSlug?.(validated),
      publish: asset.getPublish?.(validated),
      fallbackBaseName: asset.fallbackBaseName,
      replaceStoragePath,
    })

    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: source,
      storagePath: assetPath,
      allowedPublicPathPrefixes,
    })

    return { source, assetPath }
  }

  const insertTranslations = async (tx: CrudTx, validated: TCreate | TUpdate, parentId: string) => {
    if (!translations) {
      return
    }

    const rows = translations.buildRows(validated, parentId)
    if (rows.length > 0) {
      await tx.insert(translations.table).values(rows as never)
    }
  }

  const createHandler = defineEventHandler(async (event) => {
    const body = await readBody(event)
    const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

    try {
      const validated = validateBody(event, config.schema.create, body)
      config.validate?.(validated, event)
      const { source, assetPath } = await finalizeIncomingAsset(validated, cleanupTargets)

      const row = await runAdminCrudTransaction(
        async (tx) => {
          const [item] = await tx
            .insert(main.table)
            .values(main.buildValues(validated, { assetPath, event }) as never)
            .returning()

          if (!item) {
            return null
          }

          const itemId = (item as { id: string }).id
          await insertTranslations(tx, validated, itemId)

          return main.refetch(tx, itemId)
        },
        () => getAdminApiErrorMessage(event, messages.createFailed)
      )

      if (source && assetPath && source !== assetPath) {
        await cleanupUnusedAdminAssetSafely(
          { storagePath: source, allowedPublicPathPrefixes },
          `${scope.create}.cleanup`,
          event
        )
      }

      await invalidateAfterCommit(scope.create, event)
      return { data: row }
    } catch (error) {
      await cleanupAdminAssetFinalizationsSafely(cleanupTargets, `${scope.create}.rollback`, event)

      throwAdminMutationError(scope.create, error, event)
    }
  })

  const updateHandler = defineEventHandler(async (event) => {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const body = await readBody(event)

    let previousAsset: string | null = null
    let assetPath: string | null = null
    const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

    try {
      const existing = await main.loadExisting(id)
      if (!existing) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, messages.notFound),
        })
      }

      const validated = validateBody(event, config.schema.update, body)
      config.validate?.(validated, event)
      assertOptimisticLock(
        validated.updatedAt,
        existing.updatedAt,
        getAdminApiErrorMessage(event, messages.optimisticLock)
      )

      previousAsset = existing.asset

      const source = asset.getSource(validated)
      if (source) {
        if (source === existing.asset && !asset.getPublish) {
          assetPath = existing.asset
        } else {
          const finalized = await finalizeIncomingAsset(validated, cleanupTargets, existing.asset)
          assetPath = finalized.assetPath
        }
      } else {
        assetPath = null
      }

      const row = await runAdminCrudTransaction(
        async (tx) => {
          if (translations) {
            await tx.delete(translations.table).where(eq(translations.fkColumn, id))
          }

          // Without a client `updatedAt`, the version loaded above still guards the write.
          const updatedRows = await tx
            .update(main.table)
            .set(main.buildValues(validated, { assetPath, event }) as never)
            .where(
              and(
                eq(main.idColumn, id),
                buildExpectedVersionCondition(
                  main.updatedAtColumn,
                  validated.updatedAt,
                  existing.updatedAt
                )
              )
            )
            .returning({ id: main.idColumn })

          if (updatedRows.length === 0) {
            throw createError({
              statusCode: 409,
              message: getAdminApiErrorMessage(event, messages.optimisticLock),
            })
          }

          await insertTranslations(tx, validated, id)

          return main.refetch(tx, id)
        },
        () => getAdminApiErrorMessage(event, messages.updateFailed)
      )

      // The row now points at `assetPath`. The file it pointed at before (replaced, or left in
      // place by a rename or publish toggle, which copy) goes once nothing references it.
      if (previousAsset !== assetPath) {
        await cleanupUnusedAdminAssetSafely(
          { storagePath: previousAsset, allowedPublicPathPrefixes },
          `${scope.update}.cleanup`,
          event
        )
      }

      await invalidateAfterCommit(scope.update, event)
      return { data: row }
    } catch (error) {
      // Only the files this request produced are undone; the record's current file was never
      // touched, so the row still points at a file that exists.
      await cleanupAdminAssetFinalizationsSafely(cleanupTargets, `${scope.update}.rollback`, event)

      throwAdminMutationError(scope.update, error, event)
    }
  })

  return { createHandler, updateHandler }
}
