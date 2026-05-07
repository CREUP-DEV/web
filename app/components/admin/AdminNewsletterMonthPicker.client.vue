<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  disabledMonths?: Set<string>
  taken?: boolean
}>()

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

const monthNames = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

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
    <div class="rounded-lg border p-3" role="group" aria-label="Selector de mes y año">
      <div class="mb-2 flex items-center justify-between">
        <UButton
          icon="i-tabler-chevron-left"
          variant="ghost"
          size="sm"
          aria-label="Año anterior"
          @click="pickerYear--"
        />
        <span class="text-sm font-semibold">{{ pickerYear }}</span>
        <UButton
          icon="i-tabler-chevron-right"
          variant="ghost"
          size="sm"
          :disabled="pickerYear >= new Date().getFullYear()"
          aria-label="Año siguiente"
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
    <span class="mt-1 block text-xs" :class="taken ? 'text-error' : 'text-dimmed'">
      {{
        taken ? 'Ya existe una newsletter para ese mes.' : 'Solo se permite una newsletter por mes.'
      }}
    </span>
  </div>
</template>
