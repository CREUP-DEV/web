<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  disabledMonths?: Set<string>
  taken?: boolean
  /** Copy shown under the grid; defaults to the newsletter wording. Pass '' to hide it. */
  hint?: string
  /** Copy shown under the grid when `taken` is set; defaults to the newsletter wording. */
  takenLabel?: string
}>()

const hintText = computed(() => props.hint ?? t('admin.newsletter.monthPicker.hint'))
const takenText = computed(() => props.takenLabel ?? t('admin.newsletter.monthPicker.taken'))
const footnote = computed(() => (props.taken ? takenText.value : hintText.value))

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const pickerYear = ref(
  props.modelValue ? Number(props.modelValue.slice(0, 4)) : new Date().getFullYear()
)

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const year = Number(val.slice(0, 4))
      if (!isNaN(year)) pickerYear.value = year
    }
  }
)

const monthNames = computed(() => [
  t('admin.newsletter.monthPicker.jan'),
  t('admin.newsletter.monthPicker.feb'),
  t('admin.newsletter.monthPicker.mar'),
  t('admin.newsletter.monthPicker.apr'),
  t('admin.newsletter.monthPicker.may'),
  t('admin.newsletter.monthPicker.jun'),
  t('admin.newsletter.monthPicker.jul'),
  t('admin.newsletter.monthPicker.aug'),
  t('admin.newsletter.monthPicker.sep'),
  t('admin.newsletter.monthPicker.oct'),
  t('admin.newsletter.monthPicker.nov'),
  t('admin.newsletter.monthPicker.dec'),
])

const selectedMonth = computed(() =>
  props.modelValue ? Number(props.modelValue.slice(5, 7)) - 1 : -1
)
const selectedYear = computed(() => (props.modelValue ? Number(props.modelValue.slice(0, 4)) : -1))

function padMonth(month: number) {
  return String(month).padStart(2, '0')
}

function isMonthDisabled(monthIndex: number): boolean {
  const now = new Date()
  const monthKey = `${pickerYear.value}-${padMonth(monthIndex + 1)}`
  return (
    pickerYear.value > now.getFullYear() ||
    (pickerYear.value === now.getFullYear() && monthIndex > now.getMonth()) ||
    (props.disabledMonths?.has(monthKey) ?? false)
  )
}

function pickMonth(monthIndex: number) {
  emit('update:modelValue', `${pickerYear.value}-${padMonth(monthIndex + 1)}-01`)
}
</script>

<template>
  <div>
    <div
      class="rounded-lg border p-3"
      role="group"
      :aria-label="t('admin.newsletter.monthPicker.groupAria')"
    >
      <div class="mb-2 flex items-center justify-between">
        <UButton
          icon="i-tabler-chevron-left"
          variant="ghost"
          size="sm"
          :aria-label="t('admin.newsletter.monthPicker.prevYearAria')"
          @click="pickerYear--"
        />
        <span class="text-sm font-semibold">{{ pickerYear }}</span>
        <UButton
          icon="i-tabler-chevron-right"
          variant="ghost"
          size="sm"
          :disabled="pickerYear >= new Date().getFullYear()"
          :aria-label="t('admin.newsletter.monthPicker.nextYearAria')"
          @click="pickerYear++"
        />
      </div>
      <div class="grid grid-cols-4 gap-1">
        <button
          v-for="(name, idx) in monthNames"
          :key="idx"
          type="button"
          :disabled="isMonthDisabled(idx)"
          :aria-pressed="selectedMonth === idx && selectedYear === pickerYear"
          class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          :class="[
            selectedMonth === idx && selectedYear === pickerYear
              ? 'bg-primary text-inverted'
              : 'hover:bg-elevated',
          ]"
          @click="pickMonth(idx)"
        >
          {{ name }}
        </button>
      </div>
    </div>
    <span v-if="footnote" class="mt-1 block text-xs" :class="taken ? 'text-error' : 'text-dimmed'">
      {{ footnote }}
    </span>
  </div>
</template>
