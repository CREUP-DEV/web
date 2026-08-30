import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { memberOrgCatalogEntries } from '../../../db/schema'
import { cuid } from '../../../db/schema/common'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { validateBody } from '../../../utils/validation'
import { createMemberOrgCatalogEntrySchema } from '~~/shared/utils/adminSchemas'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import {
  cleanupAdminAssetFinalizationsSafely,
  trackAdminAssetFinalization,
  type CleanupUnusedAdminAssetOptions,
} from '../../../utils/admin/adminAssetPublication'
import { MEMBER_ORG_LOGOS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const LOGO_UPLOAD_DIR = 'public/transparencia/actividad/imagenes/organizaciones'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(event, createMemberOrgCatalogEntrySchema, body)

    // An upload lands in the temporary store; move it into the public folder or it gets swept.
    const publishLogo = async (storagePath: string | null | undefined, variant: string) => {
      if (!storagePath) return null

      const published = await finalizeAdminImage({
        storagePath,
        uploadDir: LOGO_UPLOAD_DIR,
        publicPath: MEMBER_ORG_LOGOS_PUBLIC_PATH,
        slug: `${validated.initials || validated.denomination}-${variant}`,
        publish: true,
        fallbackBaseName: 'organizacion-logo',
      })
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: storagePath,
        storagePath: published,
        allowedPublicPathPrefixes: [MEMBER_ORG_LOGOS_PUBLIC_PATH],
      })
      return published
    }

    const logoLight = await publishLogo(validated.logoLight, 'claro')
    const logoDark = await publishLogo(validated.logoDark, 'oscuro')

    const [item] = await db
      .insert(memberOrgCatalogEntries)
      .values({
        source: validated.source,
        selectionKey: `manual:${cuid()}`,
        sourceKey: null,
        denomination: validated.denomination,
        initials: validated.initials,
        logoLight,
        logoDark,
        order: validated.order,
        active: validated.active,
      })
      .returning()

    return { data: item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.member-org-catalog.create.rollback',
      event
    )
    throwAdminMutationError('admin.member-org-catalog.create', e, event)
  }
})
