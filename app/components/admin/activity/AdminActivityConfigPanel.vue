<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import type { AdminActivityKind } from '@/composables/admin/useAdminActivity'

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

const hasEndDate = ref(false)
watch(
  endDate,
  (value) => {
    hasEndDate.value = !!value
  },
  { immediate: true }
)

const kindSelectItems = computed(() =>
  Object.entries(props.kindLabels).map(([value, label]) => ({ value, label }))
)

const startInputDate = useTemplateRef<{
  inputsRef: Array<{ $el: HTMLElement | undefined } | undefined>
}>('startInputDate')
const endInputDate = useTemplateRef<{
  inputsRef: Array<{ $el: HTMLElement | undefined } | undefined>
}>('endInputDate')

const toggleEndDate = (enabled: boolean) => {
  hasEndDate.value = enabled
  if (enabled) {
    // Seed the end date so the picker renders (it is gated behind a non-null endDate). Defaulting to
    // the start date keeps the `endDate >= startDate` invariant; the user can then move it forward.
    if (!endDate.value) endDate.value = startDate.value
  } else {
    endDate.value = null
  }
}
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

    <UFormField :label="`${t('admin.activity.form.startDateLabel')} *`" :error="startDateError">
      <UInputDate ref="startInputDate" v-model="startDate" class="w-full">
        <template #trailing>
          <UPopover :reference="startInputDate?.inputsRef[3]?.$el" :popper="{ strategy: 'fixed' }">
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-tabler-calendar"
              :aria-label="t('admin.activity.form.selectDateAria')"
              class="px-0"
            />
            <template #content>
              <UCalendar v-model="startDate" class="p-2" />
            </template>
          </UPopover>
        </template>
      </UInputDate>
    </UFormField>

    <UFormField :label="t('admin.activity.form.endDateLabel')" :error="endDateError">
      <div class="mb-2 flex items-center gap-2">
        <USwitch :model-value="hasEndDate" @update:model-value="toggleEndDate" />
        <span class="text-muted text-sm">{{ t('admin.activity.form.endDateToggle') }}</span>
      </div>
      <UInputDate v-if="hasEndDate && endDate" ref="endInputDate" v-model="endDate" class="w-full">
        <template #trailing>
          <UPopover :reference="endInputDate?.inputsRef[3]?.$el" :popper="{ strategy: 'fixed' }">
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-tabler-calendar"
              :aria-label="t('admin.activity.form.selectDateAria')"
              class="px-0"
            />
            <template #content>
              <UCalendar v-model="endDate" class="p-2" />
            </template>
          </UPopover>
        </template>
      </UInputDate>
    </UFormField>

    <UFormField :label="t('admin.activity.form.onlineLabel')">
      <div class="flex items-center gap-2">
        <USwitch v-model="isOnline" />
        <span class="text-sm">{{
          isOnline ? t('admin.activity.form.onlineOn') : t('admin.activity.form.onlineOff')
        }}</span>
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
