<script setup lang="ts">
import { collectUpcomingCalendarSeries } from '@/composables/useCalendarEventSeries'
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import type { EnrichedMember } from '@/types/team'

const props = defineProps<{
  open: boolean
  member: EnrichedMember | null
  events: CalendarEvent[]
  loading: boolean
  bodyClass: string
  modalUi: { content: string }
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { t } = useI18n()
const { getDisplayName: getMemberDisplayName } = usePersonHelpers()
const { formatShortDate } = useDatePresets()

const upcomingAgendaEvents = computed(() => {
  return collectUpcomingCalendarSeries(props.events, {
    limit: 8,
    allDayLabel: t('home.calendar.allDay'),
  })
})

const agendaTransitionWrapperRef = ref<HTMLElement | null>(null)

const setAgendaTransitionStyles = (el: Element, styles: Partial<CSSStyleDeclaration>) => {
  Object.assign((el as HTMLElement).style, styles)
}

const setAgendaWrapperStyles = (styles: Partial<CSSStyleDeclaration>) => {
  if (agendaTransitionWrapperRef.value) {
    Object.assign(agendaTransitionWrapperRef.value.style, styles)
  }
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
  lockAgendaWrapperHeight()
  setAgendaTransitionStyles(el, {
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
</script>

<template>
  <UModal
    :open="open"
    :ui="modalUi"
    :title="t('team.publicAgendaOf', { name: member?.name ?? '' })"
    :description="t('team.agendaModalDescription')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="member" :class="bodyClass">
        <div class="flex items-center gap-3">
          <div class="ring-primary/20 size-12 overflow-hidden rounded-full ring-2">
            <NuxtImg
              v-if="member.photo"
              :src="member.photo"
              :alt="getMemberDisplayName(member)"
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
            <p class="text-foreground font-semibold">{{ getMemberDisplayName(member) }}</p>
            <p class="text-muted text-sm">
              {{ member.denomination || member.areaName }}
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
            <div v-if="loading" key="loading" class="space-y-2">
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
