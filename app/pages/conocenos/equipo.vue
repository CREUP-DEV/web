<script setup lang="ts">
/**
 * Team Page
 * Displays team members grouped by hierarchy or by area,
 * with data sourced from the external organigrama API.
 */
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import { useAutoAnimate } from '@formkit/auto-animate/vue'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('team.title')}`,
  description: () => t('team.description'),
  ogTitle: () => `${t('team.title')}`,
  ogDescription: () => t('team.description'),
})

// ============================================================================
// Types
// ============================================================================

type SupportedSocialNetwork =
  | 'website'
  | 'email'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'bluesky'
  | 'linkedin'
  | 'telegram'
  | 'discord'
  | 'facebook'
  | 'github'

interface SocialNetwork {
  network: SupportedSocialNetwork
  value: string
}

interface OrgMember {
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

interface OrgArea {
  id: number
  name: string
  nameTranslations?: Record<string, string>
  order: number
  members: OrgMember[]
}

interface OrgResponse {
  areas: OrgArea[]
  generatedAt?: string | null
}

// Enriched member type used throughout the page
interface EnrichedMember extends OrgMember {
  areaName: string
  areaId: number
  isLeader: boolean
}

// ============================================================================
// Data fetching
// ============================================================================

const { data, error } = await useFetch<OrgResponse>('/api/organigrama')

const areas = computed(() => data.value?.areas ?? [])

const getAreaName = (area: OrgArea) =>
  area.nameTranslations?.[locale.value] ?? area.nameTranslations?.es ?? area.name

// ============================================================================
// Tab state
// ============================================================================

type ViewMode = 'hierarchy' | 'area'
const viewMode = ref<ViewMode>('hierarchy')

const [contentRef] = useAutoAnimate()

// ============================================================================
// Hierarchy view: split into executive / extended
// ============================================================================

/** First member of each area = area leader → Comisión Ejecutiva */
const executiveMembers = computed<EnrichedMember[]>(() => {
  return areas.value
    .filter((area: OrgArea) => area.members.length > 0)
    .map((area: OrgArea) => ({
      ...area.members[0]!,
      areaName: getAreaName(area),
      areaId: area.id,
      isLeader: true,
    }))
})

/** All non-first members across all areas → Comisión Ejecutiva Ampliada */
const extendedMembers = computed<EnrichedMember[]>(() => {
  const result: EnrichedMember[] = []
  for (const area of areas.value) {
    for (let i = 1; i < area.members.length; i++) {
      result.push({
        ...area.members[i]!,
        areaName: getAreaName(area),
        areaId: area.id,
        isLeader: false,
      })
    }
  }
  return result
})

// ============================================================================
// Social network helpers
// ============================================================================

const networkIcons: Record<SupportedSocialNetwork, string> = {
  website: 'i-tabler-world',
  email: 'i-tabler-mail',
  instagram: 'i-tabler-brand-instagram',
  twitter: 'i-tabler-brand-x',
  tiktok: 'i-tabler-brand-tiktok',
  bluesky: 'i-tabler-brand-bluesky',
  linkedin: 'i-tabler-brand-linkedin',
  telegram: 'i-tabler-brand-telegram',
  discord: 'i-tabler-brand-discord',
  facebook: 'i-tabler-brand-facebook',
  github: 'i-tabler-brand-github',
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)
const cleanHandle = (value: string) => value.trim().replace(/^@/, '')

const buildSocialUrl = (network: SupportedSocialNetwork, rawValue: string) => {
  const value = rawValue.trim()
  if (!value) return null

  if (network === 'email') {
    return value.startsWith('mailto:') ? value : `mailto:${value}`
  }

  if (isAbsoluteUrl(value)) return value

  switch (network) {
    case 'website':
      return `https://${value}`
    case 'instagram':
      return `https://instagram.com/${cleanHandle(value)}`
    case 'twitter':
      return `https://x.com/${cleanHandle(value)}`
    case 'tiktok':
      return `https://www.tiktok.com/@${cleanHandle(value)}`
    case 'bluesky':
      return `https://bsky.app/profile/${cleanHandle(value)}`
    case 'linkedin':
      return `https://www.linkedin.com/${value.replace(/^\/+/, '')}`
    case 'telegram':
      return `https://t.me/${cleanHandle(value)}`
    case 'discord':
      return `https://discord.gg/${cleanHandle(value)}`
    case 'facebook':
      return `https://facebook.com/${cleanHandle(value)}`
    case 'github':
      return `https://github.com/${cleanHandle(value)}`
    default:
      return null
  }
}

interface SocialButton {
  network: Exclude<SupportedSocialNetwork, 'website' | 'email'>
  href: string
}

const getSocialButtons = (member: OrgMember): SocialButton[] => {
  return member.socialNetworks.flatMap((sn) => {
    if (sn.network === 'website' || sn.network === 'email') return []
    const href = buildSocialUrl(sn.network, sn.value)
    if (!href) return []
    return [{ network: sn.network as SocialButton['network'], href }]
  })
}

const getContactEmail = (member: OrgMember) => {
  const contactEmail = member.socialNetworks.find((sn) => sn.network === 'email')
  return contactEmail?.value || member.email
}

const getFullName = (member: Pick<OrgMember, 'name' | 'surname'>) => {
  return [member.name, member.surname].filter(Boolean).join(' ').trim()
}

const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`
const getCopyEmailAriaLabel = (email: string) => `${t('common.copyEmail')}: ${email}`
const getPublicAgendaAriaLabel = (fullName: string) => `${t('team.publicAgenda')}: ${fullName}`

// ============================================================================
// Modal state
// ============================================================================

const selectedMember = ref<EnrichedMember | null>(null)
const modalOpen = ref(false)

const openMemberModal = (member: EnrichedMember) => {
  selectedMember.value = member
  modalOpen.value = true
}

const toEnrichedMember = (member: OrgMember, area: OrgArea, isLeader: boolean): EnrichedMember => ({
  ...member,
  areaName: getAreaName(area),
  areaId: area.id,
  isLeader,
})

const closeMemberModal = () => {
  modalOpen.value = false
  selectedMember.value = null
}

// ============================================================================
// Copy email
// ============================================================================

const toast = useToast()

const copyEmail = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email)
    toast.add({
      title: t('common.emailCopied'),
      color: 'success',
    })
  } catch (e) {
    console.error('Error copying email:', e)
  }
}

// ============================================================================
// Public agenda (overlay panel for area leaders)
// ============================================================================

const agendaMember = ref<EnrichedMember | null>(null)
const agendaOpen = ref(false)
const agendaEvents = ref<CalendarEvent[]>([])
const agendaLoading = ref(false)
const agendaModalUi = computed(() => ({
  content: [
    'transition-all duration-300 ease-out',
    agendaLoading.value ? 'sm:max-w-md' : 'sm:max-w-lg',
  ],
}))
const agendaBodyClass = computed(() => [
  'space-y-4 overflow-hidden px-1 pt-1 transition-[max-height] duration-500 ease-out',
  agendaLoading.value ? 'max-h-[220px]' : 'max-h-[70vh]',
])

const openAgenda = async (member: EnrichedMember) => {
  agendaMember.value = member
  agendaOpen.value = true
  agendaEvents.value = []
  agendaLoading.value = true

  try {
    const response = await $fetch<{ events: CalendarEvent[] }>('/api/member-calendar', {
      query: {
        calendarId: member.email,
        locale: locale.value,
      },
    })
    agendaEvents.value = response.events ?? []
  } catch (e) {
    console.error('Error fetching member calendar:', e)
  } finally {
    agendaLoading.value = false
  }
}

const closeAgenda = () => {
  agendaOpen.value = false
  agendaMember.value = null
  agendaEvents.value = []
}

const openSelectedMemberAgenda = () => {
  if (!selectedMember.value) return
  void openAgenda(selectedMember.value)
  closeMemberModal()
}

// Deduplicate multi-day events into single entries
const upcomingAgendaEvents = computed(() => {
  const now = new Date()
  const bySeries = new Map<string, CalendarEvent>()

  for (const event of agendaEvents.value) {
    const seriesId = event.seriesId || event.id
    const startDate = event.startDate || event.date
    const endDate = event.endDate || event.date

    const endDateTime = event.isAllDay
      ? new Date(`${endDate}T23:59:59`)
      : event.endTime
        ? new Date(`${endDate}T${event.endTime}`)
        : new Date(`${endDate}T23:59:59`)

    if (endDateTime.getTime() < now.getTime()) continue

    const existing = bySeries.get(seriesId)
    if (!existing) {
      bySeries.set(seriesId, { ...event, startDate, endDate })
      continue
    }

    const existingStart = existing.startDate || existing.date
    const existingEnd = existing.endDate || existing.date

    if (startDate < existingStart) existing.startDate = startDate
    if (endDate > existingEnd) existing.endDate = endDate
  }

  return Array.from(bySeries.values())
    .sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))
    .slice(0, 8)
})

const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })
}

// ============================================================================
// Tab items for UTabs
// ============================================================================

const tabItems = computed(() => [
  { label: t('team.hierarchyView'), value: 'hierarchy' as ViewMode, icon: 'i-tabler-hierarchy-2' },
  { label: t('team.areaView'), value: 'area' as ViewMode, icon: 'i-tabler-layout-grid' },
])
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <!-- Page Header -->
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('team.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('team.description') }}</p>
      </header>

      <!-- Error -->
      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('team.loadError')"
      />

      <!-- Tab selector -->
      <div class="mb-8 flex justify-center">
        <UTabs
          :items="tabItems"
          :model-value="viewMode"
          @update:model-value="viewMode = $event as ViewMode"
        />
      </div>

      <!-- Content area with auto-animate -->
      <div ref="contentRef">
        <!-- ============================================================ -->
        <!-- HIERARCHY VIEW -->
        <!-- ============================================================ -->
        <div v-if="viewMode === 'hierarchy'" key="hierarchy" class="space-y-12">
          <!-- Comisión Ejecutiva -->
          <section v-if="executiveMembers.length > 0" aria-labelledby="executive-heading">
            <h2
              id="executive-heading"
              class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ t('team.executiveCommission') }}
            </h2>

            <div class="flex flex-wrap justify-center gap-6">
              <article
                v-for="member in executiveMembers"
                :key="`exec-${member.areaId}`"
                class="group bg-surface/50 hover:bg-surface w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50"
                @click="openMemberModal(member)"
              >
                <!-- Photo -->
                <div class="mb-4 flex justify-center">
                  <div
                    class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                  >
                    <img
                      v-if="member.photo"
                      :src="member.photo"
                      :alt="getFullName(member)"
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

                <!-- Info -->
                <div class="text-center">
                  <p v-if="member.denomination" class="text-primary text-sm font-medium">
                    {{ member.denomination }}
                  </p>
                  <p class="text-foreground mt-1 font-semibold">{{ getFullName(member) }}</p>
                  <p class="text-muted mt-1 text-xs">{{ member.areaName }}</p>

                  <button
                    type="button"
                    class="sr-only"
                    :aria-label="getViewProfileAriaLabel(getFullName(member))"
                    @click.stop="openMemberModal(member)"
                  >
                    {{ t('team.viewProfile') }}
                  </button>

                  <button
                    type="button"
                    class="text-muted hover:text-primary mt-2 inline-flex items-center gap-1 text-sm transition-colors"
                    :aria-label="getCopyEmailAriaLabel(member.email)"
                    @click.stop="copyEmail(member.email)"
                  >
                    <UIcon name="i-tabler-mail" class="size-4" />
                    <span>{{ member.email }}</span>
                  </button>

                  <!-- Public agenda button for leaders -->
                  <div class="mt-3">
                    <UButton
                      size="xs"
                      variant="soft"
                      icon="i-tabler-calendar"
                      :aria-label="getPublicAgendaAriaLabel(getFullName(member))"
                      @click.stop="openAgenda(member)"
                    >
                      {{ t('team.publicAgenda') }}
                    </UButton>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <!-- Comisión Ejecutiva Ampliada -->
          <section v-if="extendedMembers.length > 0" aria-labelledby="extended-heading">
            <h2
              id="extended-heading"
              class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ t('team.extendedCommission') }}
            </h2>

            <div class="flex flex-wrap justify-center gap-6">
              <article
                v-for="(member, idx) in extendedMembers"
                :key="`ext-${member.areaId}-${idx}`"
                class="group bg-surface/50 hover:bg-surface w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50"
                @click="openMemberModal(member)"
              >
                <!-- Photo -->
                <div class="mb-4 flex justify-center">
                  <div
                    class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                  >
                    <img
                      v-if="member.photo"
                      :src="member.photo"
                      :alt="getFullName(member)"
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

                <!-- Info -->
                <div class="text-center">
                  <p v-if="member.denomination" class="text-primary text-sm font-medium">
                    {{ member.denomination }}
                  </p>
                  <p class="text-foreground mt-1 font-semibold">{{ getFullName(member) }}</p>
                  <p class="text-muted mt-1 text-xs">{{ member.areaName }}</p>

                  <button
                    type="button"
                    class="sr-only"
                    :aria-label="getViewProfileAriaLabel(getFullName(member))"
                    @click.stop="openMemberModal(member)"
                  >
                    {{ t('team.viewProfile') }}
                  </button>

                  <button
                    type="button"
                    class="text-muted hover:text-primary mt-2 inline-flex items-center gap-1 text-sm transition-colors"
                    :aria-label="getCopyEmailAriaLabel(member.email)"
                    @click.stop="copyEmail(member.email)"
                  >
                    <UIcon name="i-tabler-mail" class="size-4" />
                    <span>{{ member.email }}</span>
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- ============================================================ -->
        <!-- AREA VIEW -->
        <!-- ============================================================ -->
        <div v-else key="area" class="space-y-12">
          <section
            v-for="area in areas"
            :key="`area-${area.id}`"
            :aria-labelledby="`area-heading-${area.id}`"
          >
            <h2
              :id="`area-heading-${area.id}`"
              class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ getAreaName(area) }}
            </h2>

            <div class="flex flex-wrap justify-center gap-6">
              <article
                v-for="(member, idx) in area.members"
                :key="`area-${area.id}-member-${idx}`"
                class="group bg-surface/50 hover:bg-surface w-full max-w-md cursor-pointer rounded-xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] dark:ring-gray-800/50"
                @click="openMemberModal(toEnrichedMember(member, area, idx === 0))"
              >
                <!-- Photo -->
                <div class="mb-4 flex justify-center">
                  <div
                    class="ring-primary/20 group-hover:ring-primary/40 size-24 overflow-hidden rounded-full ring-2 transition-all sm:size-28"
                  >
                    <img
                      v-if="member.photo"
                      :src="member.photo"
                      :alt="getFullName(member)"
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

                <!-- Info -->
                <div class="text-center">
                  <p v-if="member.denomination" class="text-primary text-sm font-medium">
                    {{ member.denomination }}
                  </p>
                  <p class="text-foreground mt-1 font-semibold">{{ getFullName(member) }}</p>

                  <button
                    type="button"
                    class="sr-only"
                    :aria-label="getViewProfileAriaLabel(getFullName(member))"
                    @click.stop="openMemberModal(toEnrichedMember(member, area, idx === 0))"
                  >
                    {{ t('team.viewProfile') }}
                  </button>

                  <button
                    type="button"
                    class="text-muted hover:text-primary mt-2 inline-flex items-center gap-1 text-sm transition-colors"
                    :aria-label="getCopyEmailAriaLabel(member.email)"
                    @click.stop="copyEmail(member.email)"
                  >
                    <UIcon name="i-tabler-mail" class="size-4" />
                    <span>{{ member.email }}</span>
                  </button>

                  <!-- Public agenda button for area leaders (idx === 0) -->
                  <div v-if="idx === 0" class="mt-3">
                    <UButton
                      size="xs"
                      variant="soft"
                      icon="i-tabler-calendar"
                      :aria-label="getPublicAgendaAriaLabel(getFullName(member))"
                      @click.stop="openAgenda(toEnrichedMember(member, area, true))"
                    >
                      {{ t('team.publicAgenda') }}
                    </UButton>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </UContainer>

    <!-- ================================================================ -->
    <!-- Member Detail Modal -->
    <!-- ================================================================ -->
    <UModal
      v-model:open="modalOpen"
      :title="selectedMember?.denomination || selectedMember?.areaName"
      :description="t('team.memberModalDescription')"
      @close="closeMemberModal"
    >
      <template #body>
        <div v-if="selectedMember" class="space-y-6">
          <!-- Header with photo and basic info -->
          <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              class="ring-primary/30 size-28 shrink-0 overflow-hidden rounded-full ring-2 sm:size-32"
            >
              <img
                v-if="selectedMember.photo"
                :src="selectedMember.photo"
                :alt="getFullName(selectedMember)"
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
              <p v-if="selectedMember.denomination" class="text-primary text-lg font-medium">
                {{ selectedMember.denomination }}
              </p>
              <p class="text-foreground text-xl font-bold">{{ getFullName(selectedMember) }}</p>
              <UBadge size="sm" color="neutral" variant="soft" class="mt-1">
                {{ selectedMember.areaName }}
              </UBadge>

              <!-- Email -->
              <button
                type="button"
                class="text-muted hover:text-primary mt-2 flex items-center gap-1.5 text-sm transition-colors"
                :aria-label="t('common.copyEmail')"
                @click="copyEmail(getContactEmail(selectedMember))"
              >
                <UIcon name="i-tabler-mail" class="size-4" />
                <span>{{ getContactEmail(selectedMember) }}</span>
                <UIcon name="i-tabler-copy" class="size-3.5 opacity-50" />
              </button>

              <!-- University & Degree -->
              <div v-if="selectedMember.university || selectedMember.degree" class="mt-3 space-y-1">
                <p
                  v-if="selectedMember.university"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-building" class="size-4 shrink-0" />
                  <span>{{ selectedMember.university }}</span>
                </p>
                <p
                  v-if="selectedMember.degree"
                  class="text-muted flex items-center gap-1.5 text-sm"
                >
                  <UIcon name="i-tabler-school" class="size-4 shrink-0" />
                  <span>{{ selectedMember.degree }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="selectedMember.description">
            <h4 class="text-foreground mb-2 font-semibold">
              {{ t('team.about', { name: selectedMember.name }) }}
            </h4>
            <div class="text-muted prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
              {{ selectedMember.description }}
            </div>
          </div>

          <!-- Social Networks -->
          <div v-if="getSocialButtons(selectedMember).length > 0">
            <h4 class="text-foreground mb-3 font-semibold">{{ t('members.socialNetworks') }}</h4>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="sn in getSocialButtons(selectedMember)"
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

      <template #footer>
        <div v-if="selectedMember?.isLeader" class="flex w-full items-center justify-center gap-2">
          <UButton
            variant="soft"
            icon="i-tabler-calendar"
            :aria-label="getPublicAgendaAriaLabel(getFullName(selectedMember))"
            @click="openSelectedMemberAgenda"
          >
            {{ t('team.publicAgenda') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ================================================================ -->
    <!-- Public Agenda Modal -->
    <!-- ================================================================ -->
    <UModal
      v-model:open="agendaOpen"
      :ui="agendaModalUi"
      :title="t('team.publicAgendaOf', { name: agendaMember?.name ?? '' })"
      :description="t('team.agendaModalDescription')"
      @close="closeAgenda"
    >
      <template #body>
        <div v-if="agendaMember" :class="agendaBodyClass">
          <!-- Member info -->
          <div class="flex items-center gap-3">
            <div class="ring-primary/20 size-12 overflow-hidden rounded-full ring-2">
              <img
                v-if="agendaMember.photo"
                :src="agendaMember.photo"
                :alt="getFullName(agendaMember)"
                class="size-full object-cover"
              />
              <div
                v-else
                class="bg-primary/10 text-primary flex size-full items-center justify-center"
              >
                <UIcon name="i-tabler-user" class="size-6" />
              </div>
            </div>
            <div>
              <p class="text-foreground font-semibold">{{ getFullName(agendaMember) }}</p>
              <p class="text-muted text-sm">{{ agendaMember.areaName }}</p>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="agendaLoading" class="space-y-2">
            <div v-for="n in 3" :key="n" class="bg-surface flex items-start gap-3 rounded-lg p-3">
              <USkeleton class="h-10 w-16 shrink-0 rounded" />
              <div class="flex-1 space-y-1">
                <USkeleton class="h-4 w-3/4" />
                <USkeleton class="h-3 w-1/2" />
              </div>
            </div>
          </div>

          <!-- Events list -->
          <ul v-else-if="upcomingAgendaEvents.length > 0" class="space-y-2">
            <li
              v-for="(event, idx) in upcomingAgendaEvents"
              :key="idx"
              class="bg-surface flex items-start gap-3 rounded-lg p-3"
            >
              <!-- Date badge -->
              <div
                class="bg-primary/10 flex min-h-10 w-16 shrink-0 flex-col items-center justify-center rounded py-1 text-center"
              >
                <span class="text-primary text-xs leading-tight font-semibold">
                  {{ formatShortDate(event.startDate || event.date) }}
                </span>
                <span
                  v-if="event.endDate && event.startDate !== event.endDate"
                  class="text-primary text-xs leading-tight font-semibold"
                >
                  {{ formatShortDate(event.endDate) }}
                </span>
              </div>
              <!-- Event details -->
              <div class="min-w-0 flex-1">
                <p class="text-foreground line-clamp-2 text-sm font-medium">
                  {{ event.title }}
                </p>
                <p class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                  <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" />
                  <span>{{ event.timeSlot }}</span>
                </p>
                <p v-if="event.location" class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                  <UIcon name="i-tabler-map-pin" class="size-3.5 shrink-0" />
                  <span class="truncate">{{ event.location }}</span>
                </p>
              </div>
            </li>
          </ul>

          <!-- No events -->
          <div v-else class="flex flex-col items-center py-6 text-center">
            <UIcon name="i-tabler-calendar-off" class="text-muted mb-2 size-10" />
            <p class="text-muted text-sm">{{ t('team.noEvents') }}</p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
