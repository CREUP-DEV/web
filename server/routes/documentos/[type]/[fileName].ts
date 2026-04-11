import { createError, defineEventHandler, getRouterParam, getRequestURL } from 'h3'
import { proxyExternalAssetBySource } from '../../../utils/externalAssetProxy'
import { getPublicApiErrorMessage } from '../../../utils/apiErrorMessages'
import { resolvePolicyDocumentSourceByTypeAndFileName } from '../../../utils/policyDocumentDownloads'
import {
  policyDocumentFileNameParamSchema,
  policyDocumentTypeRouteParamSchema,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const notFoundMessage = getPublicApiErrorMessage(event, 'documentNotFound')
  const parsedType = policyDocumentTypeRouteParamSchema.safeParse({
    type: getRouterParam(event, 'type'),
  })

  if (!parsedType.success) {
    throw createError({
      statusCode: 404,
      message: notFoundMessage,
    })
  }

  const pathname = getRequestURL(event).pathname
  const prefix = `/documentos/${parsedType.data.type}/`
  const rawFileName = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : ''
  const parsedFileName = policyDocumentFileNameParamSchema.safeParse({ fileName: rawFileName })

  if (!parsedFileName.success) {
    throw createError({
      statusCode: 404,
      message: notFoundMessage,
    })
  }

  const sourceUrl = await resolvePolicyDocumentSourceByTypeAndFileName(
    event,
    parsedType.data.type,
    parsedFileName.data.fileName
  )

  if (!sourceUrl) {
    throw createError({
      statusCode: 404,
      message: notFoundMessage,
    })
  }

  return proxyExternalAssetBySource(event, 'pdf', sourceUrl)
})
