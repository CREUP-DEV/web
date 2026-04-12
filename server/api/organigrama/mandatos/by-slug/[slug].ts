import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../../utils/externalApiCache'
import { getPublicApiErrorMessage } from '../../../../utils/apiErrorMessages'
import { fetchMandatesBySlug, fetchMandateDetail } from '../../../../utils/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../../../utils/runtimeConfig'
import {
  mandateSlugRouteParamSchema,
  validatePublicRouteParams,
} from '../../../../utils/validation'
import { getBaseLanguage, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  const { slug } = validatePublicRouteParams(event, mandateSlugRouteParamSchema)

  const matches = await fetchMandatesBySlug(configuredBaseUrl, slug, cacheOptions, event)

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      message: getPublicApiErrorMessage(event, 'mandateNotFoundByDate'),
    })
  }

  if (matches.length > 1) {
    return {
      ambiguous: true as const,
      mandates: matches,
    }
  }

  const detail = await fetchMandateDetail(configuredBaseUrl, matches[0]!.id, cacheOptions, event)
  const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALE_CODES)
  const translatedLocaleSet = new Set<string>(['es'])

  for (const area of detail.areas) {
    for (const localeCodeRaw of Object.keys(area.nameTranslations ?? {})) {
      const localeCode = getBaseLanguage(localeCodeRaw)
      if (!localeCode || !supportedLocaleSet.has(localeCode)) {
        continue
      }

      const translationValue = area.nameTranslations[localeCodeRaw]
      if (typeof translationValue === 'string' && translationValue.trim().length > 0) {
        translatedLocaleSet.add(localeCode)
      }
    }
  }

  return {
    ambiguous: false as const,
    ...detail,
    translatedLocales: Array.from(translatedLocaleSet),
  }
})
