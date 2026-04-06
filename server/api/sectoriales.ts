import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { getRequiredExternalApiBaseUrl } from '../utils/runtimeConfig'
import { externalSectorialMembersResponseSchema } from '../utils/validation'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/requestLocale'

interface SectorialMemberOutput {
  id: string
  order: number
  denomination: string
  initials: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SocialNetworkEntry[]
}

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizeText = normalizeSocialText

const messagesByLocale = {
  en: {
    unavailable: 'Sectorial data is temporarily unavailable.',
  },
  es: {
    unavailable: 'La información de las sectoriales no está disponible temporalmente.',
  },
}

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:sectoriales:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/usuarios/sectoriales', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.sectoriales.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsedPayload = externalSectorialMembersResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.sectoriales.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const sectoriales: SectorialMemberOutput[] = parsedPayload.data.data.map((member, index) => {
        const socialNetworks = collectSocialNetworks(member.social_networks)

        const denomination = normalizeText(member.denomination)
        const initials = normalizeText(member.initials)

        const identifierSeed = initials || denomination || `sectorial-${index + 1}`
        const rawIdentifier = `${member.order}-${identifierSeed}`
        const fallbackSlug = `sectorial-${index + 1}`
        const id = slugify(rawIdentifier) || fallbackSlug

        return {
          id,
          order: member.order,
          denomination,
          initials,
          description: normalizeText(member.description) || null,
          logoLight: toExternalImageProxyUrl(normalizeText(member.web_logo_light), {
            event,
            forceProxyRelative: true,
            publicPathBase: '/conocenos/imagenes',
          }),
          logoDark: toExternalImageProxyUrl(normalizeText(member.web_logo_dark), {
            event,
            forceProxyRelative: true,
            publicPathBase: '/conocenos/imagenes',
          }),
          socialNetworks,
        }
      })

      sectoriales.sort((a, b) => a.order - b.order)

      return {
        sectoriales,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
