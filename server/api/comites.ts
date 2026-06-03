import { createError, type H3Event } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/cache/externalApiCache'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'
import { toExternalImageProxyUrlWithKindHint } from '../utils/external/externalAssetKind'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { logError } from '../utils/core/logger'
import { getRequiredExternalApiBaseUrl } from '../utils/core/runtimeConfig'
import { externalCommitteesResponseSchema } from '../utils/validation'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

interface CommitteeMemberOutput {
  id: string
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
const PUBLIC_COMMITTEES_CACHE_VERSION = 1

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildStableCommitteeMemberId = (
  parts: Array<string | null | undefined>,
  fallbackIndex: number
) => {
  const baseId = slugify(parts.filter(Boolean).join('-'))
  return baseId || `committee-member-${fallbackIndex + 1}`
}

async function buildCommitteesResponse(event: H3Event) {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions, 0)

  return withExternalApiSWRCache(
    `external-api:comites:v${PUBLIC_COMMITTEES_CACHE_VERSION}:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/comites', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.committees.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'committeesUnavailable'),
        })
      }

      const parsedPayload = externalCommitteesResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.committees.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'committeesUnavailable'),
        })
      }

      const committees: CommitteeOutput[] = await Promise.all(
        parsedPayload.data.data
          .sort((a, b) => a.committee_order - b.committee_order)
          .map(async (committee) => {
            const members: CommitteeMemberOutput[] = await Promise.all(
              committee.members
                .sort((a, b) => a.order - b.order)
                .map(async (member, index) => {
                  const socialNetworks = collectSocialNetworks(member.social_networks)
                  const normalizedDenomination = normalizeText(member.denomination) || null
                  const normalizedEmail = normalizeText(member.email) || ''
                  const normalizedName = normalizeText(member.name) || ''
                  const normalizedSurname = normalizeText(member.surname) || ''
                  const normalizedUniversity = normalizeText(member.university) || null

                  return {
                    id: buildStableCommitteeMemberId(
                      [
                        normalizedEmail,
                        normalizedName,
                        normalizedSurname,
                        normalizedDenomination,
                        normalizedUniversity,
                        String(committee.committee_id),
                      ],
                      index
                    ),
                    order: member.order,
                    denomination: normalizedDenomination,
                    photo: await toExternalImageProxyUrlWithKindHint(
                      normalizeText(member.web_photo),
                      {
                        event,
                        forceProxyRelative: true,
                        publicPathBase: '/conocenos/imagenes',
                      }
                    ),
                    email: normalizedEmail,
                    name: normalizedName,
                    surname: normalizedSurname,
                    university: normalizedUniversity,
                    degree: normalizeText(member.degree) || null,
                    description: normalizeText(member.description) || null,
                    publicAgenda: member.public_agenda ?? false,
                    socialNetworks,
                  }
                })
            )
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
      )

      return {
        data: committees,
        meta: {
          generatedAt: parsedPayload.data.generated_at ?? null,
        },
      }
    },
    cacheOptions
  )
}

export default defineCachedEventHandler((event) => buildCommitteesResponse(event), {
  ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  getKey: (event) => buildPublicRouteCacheKey(event, 'comites', { includeLocale: false }),
})
