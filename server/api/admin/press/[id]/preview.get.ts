import { createError, defineEventHandler } from 'h3'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'
import {
  buildPressArticleDetailPayload,
  buildPressArticlePreviewStatus,
  findPressArticleForPreview,
  loadPressArticleDetailDefaults,
} from '../../../../utils/press/pressArticleDetail'

/**
 * The public detail payload of any article, drafts and scheduled ones included, for the admin
 * preview page. `data` has exactly the shape of `GET /api/press/[slug]`; `meta` says whether the
 * article is public and, if not, why. Never route-cached: it must show the latest save.
 */
export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const [article, defaultCovers] = await Promise.all([
    findPressArticleForPreview(id),
    loadPressArticleDetailDefaults(),
  ])

  if (!article) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return {
    data: buildPressArticleDetailPayload(event, article, defaultCovers),
    meta: buildPressArticlePreviewStatus(article),
  }
})
