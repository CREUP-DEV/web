import { createError, defineEventHandler, getRouterParam, getRequestURL } from 'h3'
import { proxyExternalAssetBySource } from '../../../utils/externalAssetProxy'
import { resolvePolicyDocumentSourceByTypeAndFileName } from '../../../utils/policyDocumentDownloads'
import { getRequestLocaleContext } from '../../../utils/requestLocale'
import {
  policyDocumentFileNameParamSchema,
  policyDocumentTypeRouteParamSchema,
} from '../../../utils/validation'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const messagesByLocale = {
  en: {
    notFound: 'Document not found.',
  },
  es: {
    notFound: 'Documento no encontrado.',
  },
}

export default defineEventHandler(async (event) => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es
  const parsedType = policyDocumentTypeRouteParamSchema.safeParse({
    type: getRouterParam(event, 'type'),
  })

  if (!parsedType.success) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.notFound,
    })
  }

  const pathname = getRequestURL(event).pathname
  const prefix = `/documentos/${parsedType.data.type}/`
  const rawFileName = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : ''
  const parsedFileName = policyDocumentFileNameParamSchema.safeParse({ fileName: rawFileName })

  if (!parsedFileName.success) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.notFound,
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
      statusMessage: messages.notFound,
    })
  }

  return proxyExternalAssetBySource(event, 'pdf', sourceUrl)
})
