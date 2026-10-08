import { createError, defineEventHandler } from 'h3'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'
import {
  buildActivityEntryDetailPayload,
  buildActivityEntryPreviewStatus,
  findActivityEntryForPreview,
  loadActivityEntryDetailDefaults,
} from '../../../../utils/activity/activityEntryDetail'

/**
 * The public detail payload of any entry, inactive ones included, for the admin preview page.
 * `data` has exactly the shape of `GET /api/activity/[slug]`; `meta` says whether the entry is
 * public. Never route-cached: it must show the latest save.
 */
export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const [entry, siteDefaultImageEntries] = await Promise.all([
    findActivityEntryForPreview(id),
    loadActivityEntryDetailDefaults(),
  ])

  if (!entry) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return {
    data: buildActivityEntryDetailPayload(event, entry, siteDefaultImageEntries),
    meta: buildActivityEntryPreviewStatus(entry),
  }
})
