import { createError, getRouterParam } from 'h3'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import { throwPublicDatabaseAwareError } from '../../utils/public/publicErrors'
import {
  PUBLIC_CMS_CACHE_SCOPES,
  publicRouteCacheOptions,
  setPublicRouteVaryHeaders,
} from '../../utils/cache/publicRouteCache'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import {
  buildActivityEntryDetailPayload,
  findPublicActivityEntryBySlug,
  loadActivityEntryDetailDefaults,
} from '../../utils/activity/activityEntryDetail'

/**
 * A former slug answers with the entry that carried it, `slug` included, so the page can redirect
 * to the current URL. Admin mutations purge the whole scope, so a cached entry for a former slug
 * never outlives a later rename.
 */
export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { slug } = validatePublicRouteParams(event, slugRouteParamSchema)

    try {
      const [entry, siteDefaultImageEntries] = await Promise.all([
        findPublicActivityEntryBySlug(slug),
        loadActivityEntryDetailDefaults(),
      ])

      if (!entry) {
        throw createError({
          statusCode: 404,
          message: getPublicApiErrorMessage(event, 'articleNotFound'),
        })
      }

      return { data: buildActivityEntryDetailPayload(event, entry, siteDefaultImageEntries) }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.activity-detail', error, { slug })
    }
  },
  publicRouteCacheOptions(PUBLIC_CMS_CACHE_SCOPES.activityDetail, {
    keyParts: (event) => [getRouterParam(event, 'slug') ?? ''],
  })
)
