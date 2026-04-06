<script setup lang="ts">
import { socialNetworkIcons, type SocialNetworkEntry } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const route = useRoute()
const localePath = useLocalePath()
const { getFullName, getSocialButtons } = usePersonHelpers()

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
  generatedAt?: string | null
}

const slug = computed(() => route.params.slug as string)

type SlugResponse =
  | ({ ambiguous: false } & MandateDetailResponse)
  | { ambiguous: true; mandates: MandateInfo[] }

const { data, error, status } = await useFetch<SlugResponse>(
  () => `/api/organigrama/mandatos/by-slug/${slug.value}`
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('error.notFound') : t('error.message'),
  })
}

if (data.value?.ambiguous === true) {
  const year = slug.value.slice(0, 4)
  await navigateTo(localePath(`/conocenos/equipo/historico?select=${encodeURIComponent(year)}`), {
    redirectCode: 302,
  })
}

const mandate = computed(() => (data.value && !data.value.ambiguous ? data.value.mandate : null))
const areas = computed(() => (data.value && !data.value.ambiguous ? data.value.areas : []))
const areaVisibility = useVisibilityRegistry({ threshold: 0.12, animateVisibleOnMount: true })
usePageSeo(
  () =>
    mandate.value
      ? `${t('mandates.mandateOf')} ${formatShortDate(mandate.value.startDate)} — ${mandate.value.endDate ? formatShortDate(mandate.value.endDate) : t('mandates.present')}`
      : t('mandates.title'),
  () => t('mandates.detailDescription')
)

const getAreaName = (area: AreaTerm) =>
  pickLocalizedValue(area.nameTranslations ?? {}, locale.value, fallbackLocale) ?? area.name

const {
  formatLongDate: formatDate,
  formatMonthYear: formatShortDate,
  formatShortDate: formatCompactDateText,
} = useDatePresets()

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

const networkIcons = socialNetworkIcons

const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`

const selectedAssignment = ref<Assignment | null>(null)
const selectedAreaName = ref<string>('')
const modalOpen = ref(false)

const openMemberModal = (assignment: Assignment, areaName: string) => {
  selectedAssignment.value = assignment
  selectedAreaName.value = areaName
  modalOpen.value = true
}

const closeMemberModal = () => {
  modalOpen.value = false
  selectedAssignment.value = null
  selectedAreaName.value = ''
}
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <div class="mb-4">
          <UButton
            to="/conocenos/equipo/historico"
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
              —
              {{ mandate.endDate ? formatDate(mandate.endDate) : t('mandates.present') }}
            </p>
          </div>
          <p class="text-muted mt-1 text-sm">
            {{ getDurationText(mandate.startDate, mandate.endDate) }}
          </p>
        </div>
      </header>

      <div v-if="status === 'pending'" class="space-y-10">
        <div v-for="n in 3" :key="n">
          <USkeleton class="mb-4 h-8 w-48" />
          <div class="flex flex-wrap gap-6">
            <div
              v-for="m in 2"
              :key="m"
              class="bg-surface/50 w-full max-w-md rounded-xl p-5 ring-1 ring-gray-200/50 md:w-[calc(50%-0.75rem)] dark:ring-gray-800/50"
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
              class="motion-card-strong bg-surface/50 hover:bg-surface group focus-visible:ring-primary w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 ring-gray-200/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50"
              :class="
                entranceClasses(
                  areaVisibility.shouldAnimate(`area-${area.areaTermId}`),
                  areaVisibility.isVisible(`area-${area.areaTermId}`),
                  areaVisibility.isPending(`area-${area.areaTermId}`)
                )
              "
              :style="
                entranceStyle(
                  areaVisibility.isVisible(`area-${area.areaTermId}`),
                  areaVisibility.shouldAnimate(`area-${area.areaTermId}`),
                  index
                )
              "
              :aria-label="getViewProfileAriaLabel(getFullName(assignment.member))"
              @click="openMemberModal(assignment, getAreaName(area))"
            >
              <div class="mb-4 flex justify-center">
                <div
                  class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                >
                  <NuxtImg
                    v-if="assignment.member.photo"
                    :src="assignment.member.photo"
                    :alt="getFullName(assignment.member)"
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
                  {{ getFullName(assignment.member) }}
                </p>

                <div class="mt-2 flex items-center justify-center gap-1">
                  <UIcon name="i-tabler-calendar" class="text-muted size-3.5 shrink-0" />
                  <span class="text-muted text-xs">
                    {{ formatCompactDate(assignment.startDate) }}
                    —
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
      :title="selectedAssignment?.member.denomination || selectedAreaName"
      :description="t('team.memberModalDescription')"
      @close="closeMemberModal"
    >
      <template #body>
        <div v-if="selectedAssignment" class="space-y-6">
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              class="ring-primary/30 size-28 shrink-0 overflow-hidden rounded-full ring-2 sm:size-32"
            >
              <NuxtImg
                v-if="selectedAssignment.member.photo"
                :src="selectedAssignment.member.photo"
                :alt="getFullName(selectedAssignment.member)"
                class="size-full object-cover"
              />
              <div
                v-else
                class="bg-primary/10 text-primary flex size-full items-center justify-center"
              >
                <UIcon name="i-tabler-user" class="size-14" />
              </div>
            </div>

            <div class="text-center sm:text-left">
              <p
                v-if="selectedAssignment.member.denomination"
                class="text-primary text-lg font-medium"
              >
                {{ selectedAssignment.member.denomination }}
              </p>
              <p class="text-foreground text-xl font-bold">
                {{ getFullName(selectedAssignment.member) }}
              </p>
              <UBadge size="sm" color="neutral" variant="soft" class="mt-1">
                {{ selectedAreaName }}
              </UBadge>

              <div class="mt-2 flex items-center gap-1.5 text-sm">
                <UIcon name="i-tabler-calendar" class="text-muted size-4 shrink-0" />
                <span class="text-muted">
                  {{ formatCompactDate(selectedAssignment.startDate) }}
                  —
                  {{
                    selectedAssignment.endDate
                      ? formatCompactDate(selectedAssignment.endDate)
                      : t('mandates.present')
                  }}
                </span>
              </div>
              <p class="text-muted text-xs">
                {{ getDurationText(selectedAssignment.startDate, selectedAssignment.endDate) }}
              </p>

              <div
                v-if="selectedAssignment.member.university || selectedAssignment.member.degree"
                class="mt-3 space-y-1"
              >
                <p
                  v-if="selectedAssignment.member.university"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-building" class="size-4 shrink-0" />
                  <span>{{ selectedAssignment.member.university }}</span>
                </p>
                <p
                  v-if="selectedAssignment.member.degree"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-school" class="size-4 shrink-0" />
                  <span>{{ selectedAssignment.member.degree }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-if="selectedAssignment.member.description">
            <h4 class="text-foreground mb-2 font-semibold">
              {{ t('team.about', { name: selectedAssignment.member.name }) }}
            </h4>
            <div class="text-muted prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {{ selectedAssignment.member.description }}
            </div>
          </div>

          <div v-if="getSocialButtons(selectedAssignment.member).length > 0">
            <h4 class="text-foreground mb-3 font-semibold">{{ t('members.socialNetworks') }}</h4>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="sn in getSocialButtons(selectedAssignment.member)"
                :key="`${sn.network}-${sn.href}`"
                :to="sn.href"
                target="_blank"
                :icon="networkIcons[sn.network]"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ t(`members.networks.${sn.network}`) }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
