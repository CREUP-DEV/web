<script setup lang="ts">
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import { collectUpcomingCalendarSeries } from '@/composables/useCalendarEventSeries'
import type { SocialNetworkEntry } from '~~/shared/utils/social'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const localeApiHeaders = useLocaleApiHeaders()
const { copyToClipboard } = useCopyToClipboard()
const {
  getDisplayName: getMemberDisplayName,
  getContactEmail,
  getCopyEmailAriaLabel,
} = usePersonHelpers()

usePageSeo('team.title', 'team.description')

type SocialNetwork = SocialNetworkEntry

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
  publicAgenda: boolean
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
interface EnrichedMember extends OrgMember {
  areaName: string
  areaId: number
  isLeader: boolean
}

const { data, error, pending } = await useFetch<OrgResponse>('/api/organigrama', {
  headers: localeApiHeaders,
  lazy: true,
})

const areas = computed(() => data.value?.areas ?? [])

const getAreaName = (area: OrgArea) =>
  pickLocalizedValue(area.nameTranslations ?? {}, locale.value, fallbackLocale) ?? area.name

type ViewMode = 'hierarchy' | 'area'
const viewMode = ref<ViewMode>('hierarchy')
const getEntranceDelay = (index: number) => useEntranceDelay(index, 70)

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

const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`
const getPublicAgendaAriaLabel = (fullName: string) => `${t('team.publicAgenda')}: ${fullName}`

const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))

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

const agendaMember = ref<EnrichedMember | null>(null)
const agendaOpen = ref(false)
const agendaEvents = ref<CalendarEvent[]>([])
const agendaLoading = ref(false)
const agendaTransitionWrapperRef = ref<HTMLElement | null>(null)
const agendaModalUi = {
  content: 'sm:max-w-lg',
}
const agendaBodyClass = 'min-h-[220px] space-y-4 overflow-hidden px-1 pt-1'

const setAgendaTransitionStyles = (el: Element, styles: Partial<CSSStyleDeclaration>) => {
  Object.assign((el as HTMLElement).style, styles)
}

const setAgendaWrapperStyles = (styles: Partial<CSSStyleDeclaration>) => {
  if (!agendaTransitionWrapperRef.value) {
    return
  }

  Object.assign(agendaTransitionWrapperRef.value.style, styles)
}

const lockAgendaWrapperHeight = () => {
  if (!agendaTransitionWrapperRef.value) {
    return 0
  }

  const height = agendaTransitionWrapperRef.value.getBoundingClientRect().height

  setAgendaWrapperStyles({
    height: `${height}px`,
    overflow: 'hidden',
  })

  return height
}

const beforeAgendaExpandEnter = (el: Element) => {
  lockAgendaWrapperHeight()

  setAgendaTransitionStyles(el, {
    opacity: '0',
    transform: 'translateY(6px)',
  })
}

const enterAgendaExpand = (el: Element, done: () => void) => {
  const element = el as HTMLElement
  const nextHeight = element.scrollHeight

  setAgendaWrapperStyles({
    transition: 'height 280ms cubic-bezier(0.16, 1, 0.3, 1)',
  })

  setAgendaTransitionStyles(element, {
    transition: 'opacity 220ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
  })

  requestAnimationFrame(() => {
    setAgendaWrapperStyles({
      height: `${nextHeight}px`,
    })

    setAgendaTransitionStyles(element, {
      opacity: '1',
      transform: 'translateY(0)',
    })
  })

  const wrapper = agendaTransitionWrapperRef.value

  if (!wrapper) {
    done()
    return
  }

  const onEnd = (event: TransitionEvent) => {
    if (event.target !== wrapper || event.propertyName !== 'height') {
      return
    }

    wrapper.removeEventListener('transitionend', onEnd)
    done()
  }

  wrapper.addEventListener('transitionend', onEnd)
}

const afterAgendaExpandEnter = (el: Element) => {
  setAgendaWrapperStyles({
    height: '',
    overflow: '',
    transition: '',
  })

  setAgendaTransitionStyles(el, {
    opacity: '',
    transition: '',
    transform: '',
  })
}

const beforeAgendaExpandLeave = (el: Element) => {
  const element = el as HTMLElement

  lockAgendaWrapperHeight()

  setAgendaTransitionStyles(element, {
    opacity: '1',
    position: 'absolute',
    inset: '0',
    width: '100%',
  })
}

const leaveAgendaExpand = (el: Element, done: () => void) => {
  const element = el as HTMLElement

  setAgendaTransitionStyles(element, {
    transition: 'opacity 160ms ease',
  })

  requestAnimationFrame(() => {
    setAgendaTransitionStyles(element, {
      opacity: '0',
    })
  })

  const onEnd = (event: TransitionEvent) => {
    if (event.target !== element || event.propertyName !== 'opacity') {
      return
    }

    element.removeEventListener('transitionend', onEnd)
    done()
  }

  element.addEventListener('transitionend', onEnd)
}

const afterAgendaExpandLeave = (el: Element) => {
  setAgendaTransitionStyles(el, {
    opacity: '',
    position: '',
    inset: '',
    width: '',
    transition: '',
  })
}

const openAgenda = async (member: EnrichedMember) => {
  agendaMember.value = member
  agendaOpen.value = true
  agendaEvents.value = []
  agendaLoading.value = true

  try {
    const response = await $fetch<{ events: CalendarEvent[] }>('/api/member-calendar', {
      headers: localeApiHeaders.value,
      query: {
        calendarId: member.email,
      },
    })
    agendaEvents.value = response.events ?? []
  } catch {
    agendaEvents.value = []
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

const { formatShortDate } = useDatePresets()
const upcomingAgendaEvents = computed(() => {
  return collectUpcomingCalendarSeries(agendaEvents.value, {
    limit: 8,
    allDayLabel: t('home.calendar.allDay'),
  })
})

const tabItems = computed(() => [
  { label: t('team.hierarchyView'), value: 'hierarchy' as ViewMode, icon: 'i-tabler-hierarchy-2' },
  { label: t('team.areaView'), value: 'area' as ViewMode, icon: 'i-tabler-layout-grid' },
])
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('team.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('team.description') }}</p>
        <div class="mt-4">
          <UButton
            to="/conocenos/equipo/historico"
            variant="soft"
            icon="i-tabler-history"
            size="sm"
          >
            {{ t('team.viewHistory') }}
          </UButton>
        </div>
      </header>

      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('team.loadError')"
      />

      <div class="mb-8 flex justify-center">
        <UTabs
          :items="tabItems"
          :model-value="viewMode"
          @update:model-value="viewMode = $event as ViewMode"
        />
      </div>

      <div v-if="pending" class="space-y-8">
        <USkeleton class="mx-auto h-8 w-48 rounded" />
        <div class="flex flex-wrap justify-center gap-6">
          <USkeleton v-for="n in 6" :key="n" class="h-64 w-72 rounded-xl" />
        </div>
      </div>

      <Transition v-else name="content-switch" mode="out-in">
        <div v-if="viewMode === 'hierarchy'" key="hierarchy" class="space-y-12">
          <section v-if="executiveMembers.length > 0" aria-labelledby="executive-heading">
            <h2
              id="executive-heading"
              class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ t('team.executiveCommission') }}
            </h2>

            <TransitionGroup
              appear
              tag="div"
              name="stagger-list"
              class="flex flex-wrap justify-center gap-6"
            >
              <TeamMemberCard
                v-for="(member, index) in executiveMembers"
                :key="`exec-${member.areaId}`"
                :member="member"
                :display-name="getMemberDisplayName(member)"
                :area-label="member.areaName"
                :view-profile-aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                :copy-email-aria-label="getCopyEmailAriaLabel(member.email)"
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(index)"
                @click-card="openMemberModal(member)"
                @copy-email="copyEmail"
                @open-agenda="openAgenda(member)"
              />
            </TransitionGroup>
          </section>

          <section v-if="extendedMembers.length > 0" aria-labelledby="extended-heading">
            <h2
              id="extended-heading"
              class="border-primary mb-6 border-b-2 pb-2 text-2xl font-semibold"
            >
              {{ t('team.extendedCommission') }}
            </h2>

            <TransitionGroup
              appear
              tag="div"
              name="stagger-list"
              class="flex flex-wrap justify-center gap-6"
            >
              <TeamMemberCard
                v-for="(member, idx) in extendedMembers"
                :key="`ext-${member.areaId}-${idx}`"
                :member="member"
                :display-name="getMemberDisplayName(member)"
                :area-label="member.areaName"
                :view-profile-aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                :copy-email-aria-label="getCopyEmailAriaLabel(member.email)"
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(idx)"
                @click-card="openMemberModal(member)"
                @copy-email="copyEmail"
                @open-agenda="openAgenda(member)"
              />
            </TransitionGroup>
          </section>
        </div>

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

            <TransitionGroup
              appear
              tag="div"
              name="stagger-list"
              class="flex flex-wrap justify-center gap-6"
            >
              <TeamMemberCard
                v-for="(member, idx) in area.members"
                :key="`area-${area.id}-member-${idx}`"
                :member="member"
                :display-name="getMemberDisplayName(member)"
                :view-profile-aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                :copy-email-aria-label="getCopyEmailAriaLabel(member.email)"
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(idx)"
                @click-card="openMemberModal(toEnrichedMember(member, area, idx === 0))"
                @copy-email="copyEmail"
                @open-agenda="openAgenda(toEnrichedMember(member, area, idx === 0))"
              />
            </TransitionGroup>
          </section>
        </div>
      </Transition>
    </UContainer>

    <UModal
      v-model:open="modalOpen"
      :title="selectedMember?.denomination || selectedMember?.areaName"
      :description="t('team.memberModalDescription')"
      @close="closeMemberModal"
    >
      <template #body>
        <TeamPersonModal
          v-if="selectedMember"
          :member="selectedMember"
          :display-name="getMemberDisplayName(selectedMember)"
          :badge-label="selectedMember.areaName"
          :contact-email="getContactEmail(selectedMember)"
          :copy-email-aria-label="getCopyEmailAriaLabel(getContactEmail(selectedMember))"
          @copy-email="copyEmail"
        />
      </template>

      <template #footer>
        <div
          v-if="selectedMember?.publicAgenda"
          class="flex w-full items-center justify-center gap-2"
        >
          <UButton
            variant="soft"
            icon="i-tabler-calendar"
            :aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(selectedMember))"
            @click="openSelectedMemberAgenda"
          >
            {{ t('team.publicAgenda') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="agendaOpen"
      :ui="agendaModalUi"
      :title="t('team.publicAgendaOf', { name: agendaMember?.name ?? '' })"
      :description="t('team.agendaModalDescription')"
      @close="closeAgenda"
    >
      <template #body>
        <div v-if="agendaMember" :class="agendaBodyClass">
          <div class="flex items-center gap-3">
            <div class="ring-primary/20 size-12 overflow-hidden rounded-full ring-2">
              <NuxtImg
                v-if="agendaMember.photo"
                :src="agendaMember.photo"
                :alt="getMemberDisplayName(agendaMember)"
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
              <p class="text-foreground font-semibold">{{ getMemberDisplayName(agendaMember) }}</p>
              <p class="text-muted text-sm">
                {{ agendaMember.denomination || agendaMember.areaName }}
              </p>
            </div>
          </div>

          <div ref="agendaTransitionWrapperRef" class="relative">
            <Transition
              @before-enter="beforeAgendaExpandEnter"
              @enter="enterAgendaExpand"
              @after-enter="afterAgendaExpandEnter"
              @before-leave="beforeAgendaExpandLeave"
              @leave="leaveAgendaExpand"
              @after-leave="afterAgendaExpandLeave"
            >
              <div v-if="agendaLoading" key="loading" class="space-y-2">
                <div
                  v-for="n in 3"
                  :key="n"
                  class="bg-surface flex animate-pulse items-start gap-3 rounded-lg p-3"
                  :style="{ animationDelay: `${(n - 1) * 150}ms` }"
                >
                  <USkeleton class="h-10 w-16 shrink-0 rounded" />
                  <div class="flex-1 space-y-1">
                    <USkeleton class="h-4 w-3/4" />
                    <USkeleton class="h-3 w-1/2" />
                  </div>
                </div>
              </div>

              <TransitionGroup
                v-else-if="upcomingAgendaEvents.length > 0"
                key="events"
                tag="ul"
                appear
                name="agenda-event"
                class="space-y-2"
              >
                <li
                  v-for="(event, idx) in upcomingAgendaEvents"
                  :key="idx"
                  class="bg-surface flex items-start gap-3 rounded-lg p-3"
                  :style="{ transitionDelay: `${Math.min(idx * 45, 180)}ms` }"
                >
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
                  <div class="min-w-0 flex-1">
                    <p class="text-foreground line-clamp-2 text-sm font-medium">
                      {{ event.title }}
                    </p>
                    <p class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                      <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" />
                      <span>{{ event.timeSlot }}</span>
                    </p>
                  </div>
                </li>
              </TransitionGroup>

              <div v-else key="empty" class="flex flex-col items-center py-6 text-center">
                <UIcon name="i-tabler-calendar-off" class="text-muted mb-2 size-10" />
                <p class="text-muted text-sm">{{ t('team.noEvents') }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.agenda-event-enter-active {
  transition:
    opacity 0.24s ease,
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.agenda-event-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.agenda-event-leave-active,
.agenda-event-move {
  transition:
    opacity 0.18s ease,
    transform 0.22s ease;
}

.agenda-event-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
