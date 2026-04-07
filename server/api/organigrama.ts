import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { getRequiredExternalApiBaseUrl } from '../utils/runtimeConfig'
import { externalOrganigramaResponseSchema } from '../utils/validation'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

interface OrgMemberOutput {
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  publicAgenda: boolean
  socialNetworks: SocialNetworkEntry[]
}

interface OrgAreaOutput {
  id: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  members: OrgMemberOutput[]
}

const normalizeText = normalizeSocialText
export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:organigrama:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/organigrama', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.organigrama.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'orgChartUnavailable'),
        })
      }

      const parsedPayload = externalOrganigramaResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.organigrama.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'orgChartUnavailable'),
        })
      }

      const areas: OrgAreaOutput[] = parsedPayload.data.data
        .sort((a, b) => a.area_order - b.area_order)
        .map((area) => {
          const members: OrgMemberOutput[] = area.members
            .sort((a, b) => a.order - b.order)
            .map((member) => {
              const socialNetworks = collectSocialNetworks(member.social_networks)

              return {
                order: member.order,
                denomination: normalizeText(member.denomination) || null,
                photo: toExternalImageProxyUrl(normalizeText(member.web_photo), {
                  event,
                  forceProxyRelative: true,
                  publicPathBase: '/conocenos/imagenes',
                }),
                email: normalizeText(member.email) || '',
                name: normalizeText(member.name) || '',
                surname: normalizeText(member.surname) || '',
                university: normalizeText(member.university) || null,
                degree: normalizeText(member.degree) || null,
                description: normalizeText(member.description) || null,
                publicAgenda: member.public_agenda ?? false,
                socialNetworks,
              }
            })

          const nameTranslations: Record<string, string> = {}
          for (const [locale, translation] of Object.entries(area.area_name_translations ?? {})) {
            const normalizedLocale = normalizeText(locale)
            const normalizedTranslation = normalizeText(translation)

            if (!normalizedLocale || !normalizedTranslation) {
              continue
            }

            nameTranslations[normalizedLocale] = normalizedTranslation
          }

          if (!nameTranslations.es) {
            nameTranslations.es = area.area_name
          }

          return {
            id: area.area_id,
            name: area.area_name,
            nameTranslations,
            order: area.area_order,
            members,
          }
        })

      return {
        areas,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
