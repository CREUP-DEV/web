<script setup lang="ts">
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import type { EnrichedMember } from '@/types/team'
import { detailModalUi } from '@/utils/detailModalUi'

const { t } = useI18n()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const { getContactEmail } = usePersonHelpers()

usePageSeo('team.title', 'team.description')

const { areas, error, pending } = await useTeamPageData()

type ViewMode = 'hierarchy' | 'area'

const viewMode = useSyncedQueryParam<ViewMode>('view', {
  parse: (rawValue) => (rawValue === 'area' ? 'area' : 'hierarchy'),
  serialize: (value) => (value === 'hierarchy' ? null : value),
})
const getEntranceDelay = (index: number) => useEntranceDelay(index, 70)
const {
  executiveMembers,
  extendedMembers,
  getAreaName,
  getMemberDisplayName,
  getPublicAgendaAriaLabel,
  getViewProfileAriaLabel,
  toEnrichedMember,
} = useTeamDirectory({ areas })

const selectedMember = ref<EnrichedMember | null>(null)
const memberModalOpen = ref(false)
const queuedAgendaMember = ref<EnrichedMember | null>(null)
const agendaMember = ref<EnrichedMember | null>(null)
const agendaOpen = ref(false)
const agendaEvents = ref<CalendarEvent[]>([])
const agendaLoading = ref(false)
const agendaError = ref(false)
const agendaModalUi = {
  content: 'sm:max-w-lg',
}
const memberModalUi = detailModalUi
const agendaBodyClass = 'min-h-[220px] space-y-4 overflow-hidden px-1 pt-1'

const openMemberModal = (member: EnrichedMember) => {
  selectedMember.value = member
  queuedAgendaMember.value = null
  memberModalOpen.value = true
}

const openAgenda = async (member: EnrichedMember) => {
  agendaMember.value = member
  agendaLoading.value = true
  agendaEvents.value = []
  agendaError.value = false
  agendaOpen.value = true

  try {
    const response = await $fetch<{ events: CalendarEvent[] }>('/api/member-calendar', {
      headers: localeApiHeaders.value,
      query: {
        calendarId: member.email,
      },
    })
    agendaEvents.value = response.events ?? []
  } catch {
    agendaError.value = true
  } finally {
    agendaLoading.value = false
  }
}

const closeAgenda = () => {
  agendaOpen.value = false
}

const closeMemberModal = () => {
  memberModalOpen.value = false
}

const handleMemberModalAfterLeave = () => {
  const member = queuedAgendaMember.value

  if (!member) {
    selectedMember.value = null
    return
  }

  queuedAgendaMember.value = null
  selectedMember.value = null

  requestAnimationFrame(() => {
    void openAgenda(member)
  })
}

const openSelectedMemberAgenda = () => {
  const member = selectedMember.value

  if (!member) {
    return
  }

  queuedAgendaMember.value = member
  closeMemberModal()
}

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
            :to="localePath('/conocenos/equipo/historico')"
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

      <div v-if="pending" aria-hidden="true" class="space-y-8">
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
                :view-profile-aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(index)"
                @click-card="openMemberModal(member)"
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
                :view-profile-aria-label="getViewProfileAriaLabel(getMemberDisplayName(member))"
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(idx)"
                @click-card="openMemberModal(member)"
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
                :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(member))"
                :entrance-delay="getEntranceDelay(idx)"
                @click-card="openMemberModal(toEnrichedMember(member, area, idx === 0))"
                @open-agenda="openAgenda(toEnrichedMember(member, area, idx === 0))"
              />
            </TransitionGroup>
          </section>
        </div>
      </Transition>
    </UContainer>

    <UModal
      v-model:open="memberModalOpen"
      :ui="memberModalUi"
      :title="t('team.memberModalTitle')"
      @close="closeMemberModal"
      @after:leave="handleMemberModalAfterLeave"
    >
      <template #body>
        <TeamPersonModal
          v-if="selectedMember"
          :member="selectedMember"
          :display-name="getMemberDisplayName(selectedMember)"
          :contact-email="getContactEmail(selectedMember)"
          :show-agenda-button="selectedMember.publicAgenda"
          :public-agenda-label="t('team.publicAgenda')"
          :public-agenda-aria-label="getPublicAgendaAriaLabel(getMemberDisplayName(selectedMember))"
          @close="closeMemberModal"
          @open-agenda="openSelectedMemberAgenda"
        />
      </template>
    </UModal>

    <TeamAgendaModal
      v-model:open="agendaOpen"
      :member="agendaMember"
      :events="agendaEvents"
      :loading="agendaLoading"
      :error="agendaError"
      :body-class="agendaBodyClass"
      :modal-ui="agendaModalUi"
      @update:open="!$event && closeAgenda()"
    />
  </div>
</template>
