import { createError, defineEventHandler, getRequestURL } from 'h3'
import { proxyExternalAssetBySource } from '../../../utils/externalAssetProxy'
import { resolvePolicyDocumentSourceByTypeAndFileName } from '../../../utils/policyDocumentDownloads'
import { getRequestLocaleContext } from '../../../utils/requestLocale'
import {
  policyDocumentFileNameParamSchema,
  policyDocumentTypeRouteParamSchema,
  validateRouteParams,
} from '../../../utils/validation'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const messagesByLocale = {
  en: {
    fileNameRequired: 'Document file name is required.',
    notFound: 'Document not found.',
  },
  es: {
    fileNameRequired: 'El nombre del documento es obligatorio.',
    notFound: 'Documento no encontrado.',
  },
}

export default defineEventHandler(async (event) => {
  const { type } = validateRouteParams(event, policyDocumentTypeRouteParamSchema)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  const pathname = getRequestURL(event).pathname
  const prefix = `/documentos/${type}/`
  const rawFileName = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : ''
  const parsedFileName = policyDocumentFileNameParamSchema.safeParse({ fileName: rawFileName })

  if (!parsedFileName.success) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.fileNameRequired,
    })
  }

  const sourceUrl = await resolvePolicyDocumentSourceByTypeAndFileName(
    event,
    type,
    parsedFileName.data.fileName
  )

  if (!sourceUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.notFound,
    })
  }

  return proxyExternalAssetBySource(event, 'pdf', sourceUrl)
})
