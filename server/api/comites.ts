import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { getRequiredExternalApiBaseUrl } from '../utils/runtimeConfig'
import { externalCommitteesResponseSchema } from '../utils/validation'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/requestLocale'

interface CommitteeMemberOutput {
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

interface CommitteeOutput {
  id: number
  name: string
  nameTranslations: Record<string, string>
  description: string | null
  descriptionTranslations: Record<string, string>
  order: number
  members: CommitteeMemberOutput[]
}

const normalizeText = normalizeSocialText

const messagesByLocale = {
  en: {
    unavailable: 'Committee data is temporarily unavailable.',
  },
  es: {
    unavailable: 'La información de los comités no está disponible temporalmente.',
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
    `external-api:comites:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/comites', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.committees.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsedPayload = externalCommitteesResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.committees.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const committees: CommitteeOutput[] = parsedPayload.data.data
        .sort((a, b) => a.committee_order - b.committee_order)
        .map((committee) => {
          const members: CommitteeMemberOutput[] = committee.members
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
          for (const [locale, translation] of Object.entries(
            committee.committee_name_translations ?? {}
          )) {
            const normalizedLocale = normalizeText(locale)
            const normalizedTranslation = normalizeText(translation)

            if (!normalizedLocale || !normalizedTranslation) {
              continue
            }

            nameTranslations[normalizedLocale] = normalizedTranslation
          }

          if (!nameTranslations.es) {
            nameTranslations.es = committee.committee_name
          }

          const descriptionTranslations: Record<string, string> = {}
          for (const [locale, translation] of Object.entries(
            committee.committee_description_translations ?? {}
          )) {
            const normalizedLocale = normalizeText(locale)
            const normalizedTranslation = normalizeText(translation)

            if (!normalizedLocale || !normalizedTranslation) {
              continue
            }

            descriptionTranslations[normalizedLocale] = normalizedTranslation
          }

          const rawDescription = normalizeText(committee.committee_description)
          if (!descriptionTranslations.es && rawDescription) {
            descriptionTranslations.es = rawDescription
          }

          return {
            id: committee.committee_id,
            name: committee.committee_name,
            nameTranslations,
            description: rawDescription || null,
            descriptionTranslations,
            order: committee.committee_order,
            members,
          }
        })

      return {
        committees,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
