<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import type { AdminActivityKind } from '@/composables/admin/useAdminActivity'
import { calendarDateLikeToDateOnly } from '~~/shared/utils/date'

const props = defineProps<{
  /** Whether the form is editing an existing entry (locks the kind field) */
  isEditing: boolean
  /** Human-readable labels per activity kind */
  kindLabels: Record<AdminActivityKind, string>
  /** Icon name per activity kind */
  kindIcons: Record<AdminActivityKind, string>
  /** Field error for the start date */
  startDateError?: string
  /** Field error for the end date */
  endDateError?: string
}>()

const { t } = useI18n()

const kind = defineModel<AdminActivityKind>('kind', { required: true })
const startDate = defineModel<CalendarDate>('startDate', { required: true })
const endDate = defineModel<CalendarDate | null>('endDate', { required: true })
const isOnline = defineModel<boolean>('isOnline', { required: true })
const location = defineModel<string>('location', { required: true })
const active = defineModel<boolean>('active', { required: true })

const kindSelectItems = computed(() =>
  Object.entries(props.kindLabels).map(([value, label]) => ({ value, label }))
)

const { formatDate } = useLocaleFormatting()

const isCalendarOpen = ref(false)

type CalendarRange = { start: CalendarDate | undefined; end: CalendarDate | undefined }

// The calendar keeps its own selection while open. Deriving it from the form models instead would
// re-complete the range after every first click (a single-day activity reads back as a one-day
// range), leaving the second click to start yet another range and never an end date.
const calendarRange = shallowRef<CalendarRange>({
  start: startDate.value,
  end: endDate.value ?? startDate.value,
})

// Distinguishes the value written on open from one the user picked. Without it, reopening on a
// complete range would look like a finished selection and close the calendar immediately.
let isSeeding = false

watch(isCalendarOpen, (open) => {
  if (!open) return

  // Seeded as a finished one-day range for single-day entries, so the first click starts a new
  // range rather than stretching that day into one.
  isSeeding = true
  calendarRange.value = { start: startDate.value, end: endDate.value ?? startDate.value }
})

watch(calendarRange, (range) => {
  if (isSeeding) {
    isSeeding = false
    return
  }

  if (!range?.start) return

  startDate.value = range.start
  // A single-day activity carries no end date, which is what the public side expects.
  endDate.value = range.end && range.end.compare(range.start) > 0 ? range.end : null

  if (range.end) {
    isCalendarOpen.value = false
  }
})

// Numeric and compact: the trigger sits in a narrow sidebar, where the long public format wraps.
const formatShortDate = (value: string) =>
  formatDate(value, { day: '2-digit', month: '2-digit', year: 'numeric' })

const dateRangeLabel = computed(() => {
  const start = formatShortDate(calendarDateLikeToDateOnly(startDate.value))
  if (!endDate.value) return start

  return `${start} → ${formatShortDate(calendarDateLikeToDateOnly(endDate.value))}`
})
</script>

<template>
  <div class="space-y-5 rounded-xl border p-5">
    <h3 class="flex items-center gap-2 text-sm font-semibold">
      <UIcon name="i-tabler-settings" class="text-muted size-4" />
      {{ t('admin.activity.form.configTitle') }}
    </h3>

    <UFormField v-if="!isEditing" :label="t('admin.activity.form.kindLabel')">
      <USelectMenu v-model="kind" :items="kindSelectItems" value-key="value" class="w-full" />
    </UFormField>
    <div v-else class="flex items-center gap-2 text-sm">
      <UIcon :name="kindIcons[kind]" class="text-muted size-4 shrink-0" />
      <span>{{ kindLabels[kind] }}</span>
    </div>

    <UFormField
      :label="`${t('admin.activity.form.datesLabel')} *`"
      :error="startDateError || endDateError"
    >
      <UPopover v-model:open="isCalendarOpen">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          icon="i-tabler-calendar"
          class="w-full justify-start"
          :aria-label="t('admin.activity.form.selectRangeAria')"
        >
          {{ dateRangeLabel }}
        </UButton>

        <template #content>
          <UCalendar v-model="calendarRange" range class="p-2" />
        </template>
      </UPopover>
    </UFormField>

    <UFormField>
      <div class="flex items-center gap-2">
        <USwitch
          :model-value="!isOnline"
          :aria-label="t('admin.activity.form.inPersonLabel')"
          @update:model-value="(inPerson: boolean) => (isOnline = !inPerson)"
        />
        <span class="text-sm">{{ t('admin.activity.form.inPersonLabel') }}</span>
      </div>
    </UFormField>

    <UFormField v-if="!isOnline" :label="t('admin.activity.form.locationLabel')">
      <UInput
        v-model="location"
        class="w-full"
        :placeholder="t('admin.activity.form.locationPlaceholder')"
      />
    </UFormField>

    <UFormField :label="t('admin.activity.form.statusLabel')">
      <div class="flex items-center gap-2">
        <USwitch v-model="active" />
        <span class="text-sm">{{
          active ? t('admin.common.active') : t('admin.common.inactive')
        }}</span>
      </div>
    </UFormField>
  </div>
</template>
