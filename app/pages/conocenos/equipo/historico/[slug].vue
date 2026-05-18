<script setup lang="ts">
import { detailModalUi } from '@/utils/detailModalUi'
import type { SocialNetworkEntry } from '~~/shared/utils/social'
import { buildSocialUrl } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'
import { toAbsoluteUrl } from '~~/shared/utils/url'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const route = useRoute()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const { getDisplayName } = usePersonHelpers()
const siteConfig = useSiteConfig()
const siteUrl = useRuntimeSiteUrl()

type SocialNetwork = SocialNetworkEntry

interface AssignmentMember {
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  socialNetworks: SocialNetwork[]
}

interface Assignment {
  id: number
  role: string | null
  order: number
  startDate: string
  endDate: string | null
  member: AssignmentMember
}

interface AreaTerm {
  areaTermId: number
  areaId: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  assignments: Assignment[]
}

interface MandateInfo {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface MandateDetailResponse {
  mandate: MandateInfo
  areas: AreaTerm[]
  translatedLocales?: string[]
  generatedAt?: string | null
}

const slug = computed(() =>
  Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
)
if (!slug.value) throw createError({ statusCode: 404 })

type SlugResponse =
  | { data: { ambiguous: false } & MandateDetailResponse }
  | { data: { ambiguous: true; mandates: MandateInfo[] } }

const { data, error, status } = await useFetch<SlugResponse>(
  () => `/api/organigrama/mandatos/by-slug/${slug.value}`,
  {
    cache: 'no-cache',
    headers: localeApiHeaders,
  }
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('error.notFound') : t('error.message'),
  })
}

if (data.value?.data.ambiguous === true) {
  const year = slug.value.slice(0, 4)
  await navigateTo(localePath(`/conocenos/equipo/historico?select=${encodeURIComponent(year)}`), {
    redirectCode: 302,
  })
}

const mandate = computed(() =>
  data.value && !data.value.data.ambiguous ? data.value.data.mandate : null
)
const areas = computed(() =>
  data.value && !data.value.data.ambiguous ? data.value.data.areas : []
)
const areaVisibility = useVisibilityRegistry({ threshold: 0.12, animateVisibleOnMount: true })
const pageUrl = computed(() =>
  toAbsoluteUrl(localePath(`/conocenos/equipo/historico/${slug.value}`), siteUrl.value)
)
const structuredDataPeople = computed(() => {
  const people = new Map<string, Record<string, unknown>>()

  for (const area of areas.value) {
    for (const assignment of area.assignments) {
      const member = assignment.member
      const fullName = getDisplayName(member)
      const personKey = member.email || fullName
      const sameAs = member.socialNetworks
        .filter((social) => social.network !== 'email')
        .map((social) => buildSocialUrl(social.network, social.value))
        .filter((url): url is string => Boolean(url))

      people.set(personKey, {
        '@type': 'Person',
        name: fullName,
        image: toAbsoluteUrl(member.photo, siteUrl.value) || undefined,
        jobTitle: assignment.role || member.denomination || undefined,
        affiliation: member.university
          ? {
              '@type': 'Organization',
              name: member.university,
            }
          : undefined,
        sameAs: sameAs.length ? sameAs : undefined,
      })
    }
  }

  return [...people.values()]
})

useLocalizedPressDetailSeo({
  path: computed(() => `/conocenos/equipo/historico/${slug.value}`),
  translatedLocales: computed(() =>
    data.value && !data.value.data.ambiguous ? (data.value.data.translatedLocales ?? null) : null
  ),
})

const {
  formatLongDate: formatDate,
  formatMonthYear: formatShortDate,
  formatShortDate: formatCompactDateText,
} = useDatePresets()

usePageSeo(
  () =>
    mandate.value
      ? `${t('mandates.mandateOf')} ${formatShortDate(mandate.value.startDate)} - ${mandate.value.endDate ? formatShortDate(mandate.value.endDate) : t('mandates.present')}`
      : t('mandates.title'),
  () => t('mandates.detailDescription')
)

useHead(
  computed(() => {
    if (!mandate.value || structuredDataPeople.value.length === 0) {
      return {}
    }

    return {
      script: [
        {
          type: 'application/ld+json',
          innerHTML: serializeJsonForHtmlScript({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${t('mandates.title')} ${formatShortDate(mandate.value.startDate)}`,
            url: pageUrl.value || undefined,
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteUrl.value || undefined,
            },
            itemListElement: structuredDataPeople.value.map((person, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: person,
            })),
          }),
        },
      ],
    }
  })
)

const getAreaName = (area: AreaTerm) =>
  pickLocalizedValue(area.nameTranslations ?? {}, locale.value, fallbackLocale) ?? area.name

function formatCompactDate(dateStr: string): string {
  return formatCompactDateText(dateStr, {
    includeYear: true,
  })
}

function getDurationText(startDate: string, endDate: string | null): string {
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date()

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  if (diffDays < 30) {
    return t('mandates.durationDays', { count: diffDays })
  }

  const months = Math.floor(diffDays / 30)
  return t('mandates.durationMonths', { count: months })
}

const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`

const selectedAssignment = ref<Assignment | null>(null)
const modalOpen = ref(false)
const memberModalUi = detailModalUi

const openMemberModal = (assignment: Assignment) => {
  selectedAssignment.value = assignment
  modalOpen.value = true
}

const closeMemberModal = () => {
  modalOpen.value = false
  selectedAssignment.value = null
}

const modalAssignmentStart = computed(() =>
  selectedAssignment.value ? formatCompactDate(selectedAssignment.value.startDate) : null
)

const modalAssignmentEnd = computed(() =>
  selectedAssignment.value
    ? selectedAssignment.value.endDate
      ? formatCompactDate(selectedAssignment.value.endDate)
      : t('mandates.present')
    : null
)

const modalAssignmentDuration = computed(() =>
  selectedAssignment.value
    ? getDurationText(selectedAssignment.value.startDate, selectedAssignment.value.endDate)
    : null
)
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <div class="mb-4">
          <UButton
            :to="localePath('/conocenos/equipo/historico')"
            variant="ghost"
            icon="i-tabler-arrow-left"
            size="sm"
          >
            {{ t('mandates.backToMandates') }}
          </UButton>
        </div>

        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('mandates.title') }}</h1>

        <div v-if="mandate" class="mt-4">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <UBadge v-if="mandate.isCurrent" color="primary" variant="soft">
              {{ t('mandates.current') }}
            </UBadge>
            <p class="text-muted text-lg">
              {{ formatDate(mandate.startDate) }}
              -
              {{ mandate.endDate ? formatDate(mandate.endDate) : t('mandates.present') }}
            </p>
          </div>
          <p class="text-muted mt-1 text-sm">
            {{ getDurationText(mandate.startDate, mandate.endDate) }}
          </p>
        </div>
      </header>

      <div v-if="status === 'pending'" aria-hidden="true" class="space-y-10">
        <div v-for="n in 3" :key="n">
          <USkeleton class="mb-4 h-8 w-48" />
          <div class="flex flex-wrap gap-6">
            <div
              v-for="m in 2"
              :key="m"
              class="bg-surface/50 ring-default w-full max-w-md rounded-xl p-5 ring-1 md:w-[calc(50%-0.75rem)]"
            >
              <div class="mb-4 flex justify-center">
                <USkeleton class="size-24 rounded-full" />
              </div>
              <div class="space-y-2 text-center">
                <USkeleton class="mx-auto h-4 w-32" />
                <USkeleton class="mx-auto h-5 w-40" />
                <USkeleton class="mx-auto h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="areas.length === 0" class="flex flex-col items-center py-12 text-center">
        <UIcon name="i-tabler-users-minus" class="text-muted mb-4 size-16" />
        <p class="text-muted text-lg">{{ t('mandates.noAreas') }}</p>
      </div>

      <div v-else class="space-y-12">
        <section
          v-for="area in areas"
          :key="`area-${area.areaTermId}`"
          :aria-labelledby="`area-heading-${area.areaTermId}`"
        >
          <h2
            :id="`area-heading-${area.areaTermId}`"
            class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
          >
            {{ getAreaName(area) }}
          </h2>

          <div v-if="area.assignments.length === 0" class="text-muted py-4 text-sm">
            {{ t('mandates.noAssignments') }}
          </div>

          <div
            v-else
            :ref="areaVisibility.setRef(`area-${area.areaTermId}`)"
            class="flex flex-wrap justify-center gap-6"
          >
            <button
              v-for="(assignment, index) in area.assignments"
              :key="`assignment-${assignment.id}`"
              type="button"
              class="motion-card-strong bg-surface/50 hover:bg-surface group focus-visible:ring-primary ring-default w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              :class="
                entranceClasses(
                  areaVisibility.shouldAnimate(`area-${area.areaTermId}`),
                  areaVisibility.isVisible(`area-${area.areaTermId}`),
                  areaVisibility.isPending(`area-${area.areaTermId}`)
                )
              "
              :style="
                entranceStyle(
                  areaVisibility.shouldAnimate(`area-${area.areaTermId}`),
                  areaVisibility.isVisible(`area-${area.areaTermId}`),
                  index,
                  50
                )
              "
              :aria-label="getViewProfileAriaLabel(getDisplayName(assignment.member))"
              @click="openMemberModal(assignment)"
            >
              <div class="mb-4 flex justify-center">
                <div
                  class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                >
                  <AdaptiveImage
                    v-if="assignment.member.photo"
                    :src="assignment.member.photo"
                    :alt="getDisplayName(assignment.member)"
                    class="size-full object-cover"
                  />
                  <div
                    v-else
                    class="bg-primary/10 text-primary flex size-full items-center justify-center"
                  >
                    <UIcon name="i-tabler-user" class="size-12" />
                  </div>
                </div>
              </div>

              <div class="text-center">
                <p v-if="assignment.member.denomination" class="text-primary text-sm font-medium">
                  {{ assignment.member.denomination }}
                </p>
                <p class="text-foreground mt-1 font-semibold">
                  {{ getDisplayName(assignment.member) }}
                </p>

                <div class="mt-2 flex items-center justify-center gap-1">
                  <UIcon name="i-tabler-calendar" class="text-muted size-3.5 shrink-0" />
                  <span class="text-muted text-xs">
                    {{ formatCompactDate(assignment.startDate) }}
                    -
                    {{
                      assignment.endDate
                        ? formatCompactDate(assignment.endDate)
                        : t('mandates.present')
                    }}
                  </span>
                </div>
                <p class="text-muted mt-0.5 text-xs">
                  {{ getDurationText(assignment.startDate, assignment.endDate) }}
                </p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </UContainer>

    <UModal
      v-model:open="modalOpen"
      :ui="memberModalUi"
      :title="t('team.memberModalTitle')"
      @close="closeMemberModal"
    >
      <template #body>
        <TeamPersonModal
          v-if="selectedAssignment"
          :member="selectedAssignment.member"
          :display-name="getDisplayName(selectedAssignment.member)"
          :assignment-start="modalAssignmentStart"
          :assignment-end="modalAssignmentEnd"
          :assignment-duration="modalAssignmentDuration"
          @close="closeMemberModal"
        />
      </template>
    </UModal>
  </div>
</template>
