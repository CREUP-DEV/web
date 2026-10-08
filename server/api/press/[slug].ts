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
  buildPressArticleDetailPayload,
  findPublicPressArticleBySlug,
  loadPressArticleDetailDefaults,
} from '../../utils/press/pressArticleDetail'

/**
 * A former slug answers with the article that carried it, `slug` and `type` included, so the page
 * can redirect to the current URL. Admin mutations purge the whole scope, so a cached entry for a
 * former slug never outlives a later rename.
 */
export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { slug } = validatePublicRouteParams(event, slugRouteParamSchema)

    try {
      const [article, defaultCovers] = await Promise.all([
        findPublicPressArticleBySlug(slug),
        loadPressArticleDetailDefaults(),
      ])

      if (!article) {
        throw createError({
          statusCode: 404,
          message: getPublicApiErrorMessage(event, 'articleNotFound'),
        })
      }

      return { data: buildPressArticleDetailPayload(event, article, defaultCovers) }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.press-detail', error, { slug })
    }
  },
  publicRouteCacheOptions(PUBLIC_CMS_CACHE_SCOPES.pressDetail, {
    keyParts: (event) => [getRouterParam(event, 'slug') ?? ''],
  })
)
