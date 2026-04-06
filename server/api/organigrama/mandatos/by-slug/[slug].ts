import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../../utils/externalApiCache'
import { fetchMandatesList, fetchMandateDetail } from '../../../../utils/mandateDetail'
import { getRequestLocaleContext } from '../../../../utils/requestLocale'
import { getRequiredExternalApiBaseUrl } from '../../../../utils/runtimeConfig'
import { mandateSlugRouteParamSchema, validateRouteParams } from '../../../../utils/validation'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const messagesByLocale = {
  en: {
    notFound: 'No mandate found for the given date.',
  },
  es: {
    notFound: 'No se ha encontrado ningún mandato para esa fecha.',
  },
}

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  setExternalApiCacheHeaders(event, cacheOptions)

  const { slug } = validateRouteParams(event, mandateSlugRouteParamSchema)

  const mandates = await fetchMandatesList(configuredBaseUrl, cacheOptions, event)
  const matches = mandates.filter((m) => m.startDate.startsWith(slug))

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.notFound,
    })
  }

  if (matches.length > 1) {
    return {
      ambiguous: true as const,
      mandates: matches,
    }
  }

  const detail = await fetchMandateDetail(configuredBaseUrl, matches[0]!.id, cacheOptions, event)

  return {
    ambiguous: false as const,
    ...detail,
  }
})
