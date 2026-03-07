import { createError, defineEventHandler, getRequestURL, getRouterParam } from 'h3'
import { proxyExternalAssetBySource } from '../../../utils/externalAssetProxy'
import { resolvePolicyDocumentSourceByTypeAndFileName } from '../../../utils/policyDocumentDownloads'
import {
  policyDocumentFileNameParamSchema,
  policyDocumentRouteTypeSchema,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const parsedType = policyDocumentRouteTypeSchema.safeParse(getRouterParam(event, 'type'))
  if (!parsedType.success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document type not found.',
    })
  }

  const pathname = getRequestURL(event).pathname
  const prefix = `/documentos/${parsedType.data}/`
  const rawFileName = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : ''
  const parsedFileName = policyDocumentFileNameParamSchema.safeParse({ fileName: rawFileName })

  if (!parsedFileName.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Document file name is required.',
    })
  }

  const sourceUrl = await resolvePolicyDocumentSourceByTypeAndFileName(
    event,
    parsedType.data,
    parsedFileName.data.fileName
  )

  if (!sourceUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Document not found.',
    })
  }

  return proxyExternalAssetBySource(event, 'pdf', sourceUrl)
})
