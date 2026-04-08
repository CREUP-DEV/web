<script setup lang="ts">
import type { TeamMemberDetailResponse } from '@/types/team'
import type { CalendarEvent } from '@/composables/useGoogleCalendar'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const { copyToClipboard } = useCopyToClipboard()
const { getContactEmail, getCopyEmailAriaLabel, getDisplayName } = usePersonHelpers()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw[0] : raw
})

const memberUrl = computed(() => `/api/organigrama/${slug.value || ''}`)

const { data, error, pending } = await useFetch(memberUrl, {
  headers: localeApiHeaders,
  lazy: true,
})

const member = computed(
  () => (data.value as TeamMemberDetailResponse | null | undefined)?.member ?? null
)
const displayName = computed(() => (member.value ? getDisplayName(member.value) : ''))
const publicAgendaAriaLabel = computed(() =>
  displayName.value ? `${t('team.publicAgenda')}: ${displayName.value}` : t('team.publicAgenda')
)
const isNotFound = computed(() => error.value?.statusCode === 404)
const hasLoadError = computed(() => Boolean(error.value && !isNotFound.value))

if (!pending.value && !error.value && !member.value) {
  throw createError({
    statusCode: 404,
    fatal: true,
    message: t('error.notFound'),
  })
}

const agendaMember = ref<typeof member.value>(null)
const agendaOpen = ref(false)
const agendaEvents = ref<CalendarEvent[]>([])
const agendaLoading = ref(false)
const agendaModalUi = {
  content: 'sm:max-w-lg',
}
const agendaBodyClass = 'min-h-[220px] space-y-4 overflow-hidden px-1 pt-1'

const openAgenda = async () => {
  if (!member.value) {
    return
  }

  agendaMember.value = member.value
  agendaOpen.value = true
  agendaEvents.value = []
  agendaLoading.value = true

  try {
    const response = await $fetch<{ events: CalendarEvent[] }>('/api/member-calendar', {
      headers: localeApiHeaders.value,
      query: {
        calendarId: member.value.email,
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

const copyEmail = (email: string) => copyToClipboard(email, t('common.emailCopied'))

useSeoMeta({
  title: () => (displayName.value ? `${displayName.value} | CREUP` : 'CREUP'),
  description: () => member.value?.description ?? t('team.description'),
})
</script>

<template>
  <div>
    <UContainer v-if="hasLoadError" class="py-8 sm:py-12">
      <UAlert
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('team.loadError')"
      />
    </UContainer>

    <UContainer v-else-if="pending || (!member && !isNotFound)" class="py-8 sm:py-12">
      <div v-if="pending" class="space-y-4">
        <USkeleton class="h-8 w-56 rounded" />
        <USkeleton class="h-96 w-full rounded-3xl" />
      </div>
    </UContainer>

    <UContainer v-else-if="isNotFound || !member" class="py-8 sm:py-12">
      <UAlert
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('error.notFound')"
      />
    </UContainer>

    <TeamPersonPage
      v-else
      :member="member"
      :display-name="displayName"
      :back-to="localePath('/conocenos/equipo')"
      :contact-email="getContactEmail(member)"
      :copy-email-aria-label="getCopyEmailAriaLabel(getContactEmail(member))"
      :public-agenda-aria-label="publicAgendaAriaLabel"
      @copy-email="copyEmail"
      @open-agenda="openAgenda"
    />

    <TeamAgendaModal
      v-model:open="agendaOpen"
      :member="agendaMember"
      :events="agendaEvents"
      :loading="agendaLoading"
      :body-class="agendaBodyClass"
      :modal-ui="agendaModalUi"
      @update:open="!$event && closeAgenda()"
    />
  </div>
</template>
