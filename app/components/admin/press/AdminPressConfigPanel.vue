<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import type { PressArticleType } from '~~/shared/constants/pressTypes'

const props = defineProps<{
  /** Whether the form is editing an existing article (locks the type field) */
  isEditing: boolean
  /** Human-readable labels per article type */
  typeLabels: Record<PressArticleType, string>
  /** Icon name per article type */
  typeIcons: Record<PressArticleType, string>
  /** Select items for the tags picker */
  tagItems: Array<{ value: string; label: string }>
  /** Whether supporting data failed to load (disables the tags select) */
  hasSupportError: boolean
}>()

const { t } = useI18n()

const type = defineModel<PressArticleType>('type', { required: true })
const publishedAt = defineModel<CalendarDate>('publishedAt', { required: true })
const active = defineModel<boolean>('active', { required: true })
const tagIds = defineModel<string[]>('tagIds', { required: true })

const typeSelectItems = computed(() =>
  Object.entries(props.typeLabels).map(([value, label]) => ({ value, label }))
)

const inputDate = useTemplateRef<{
  inputsRef: Array<{ $el: HTMLElement | undefined } | undefined>
}>('inputDate')
</script>

<template>
  <div class="space-y-5 rounded-xl border p-5">
    <h3 class="flex items-center gap-2 text-sm font-semibold">
      <UIcon name="i-tabler-settings" class="text-muted size-4" />
      {{ t('admin.press.form.configTitle') }}
    </h3>

    <UFormField v-if="!isEditing" :label="t('admin.press.form.typeLabel')">
      <USelectMenu v-model="type" :items="typeSelectItems" value-key="value" class="w-full" />
    </UFormField>
    <div v-else class="flex items-center gap-2 text-sm">
      <UIcon :name="typeIcons[type]" class="text-muted size-4 shrink-0" />
      <span>{{ typeLabels[type] }}</span>
    </div>

    <UFormField :label="t('admin.press.form.publishedAtLabel')">
      <UInputDate ref="inputDate" v-model="publishedAt" class="w-full">
        <template #trailing>
          <UPopover :reference="inputDate?.inputsRef[3]?.$el" :popper="{ strategy: 'fixed' }">
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-tabler-calendar"
              :aria-label="t('admin.press.form.selectDateAria')"
              class="px-0"
            />
            <template #content>
              <UCalendar v-model="publishedAt" class="p-2" />
            </template>
          </UPopover>
        </template>
      </UInputDate>
    </UFormField>

    <UFormField :label="t('admin.press.form.statusLabel')">
      <div class="flex items-center gap-2">
        <USwitch v-model="active" />
        <span class="text-sm">{{
          active ? t('admin.common.active') : t('admin.common.inactive')
        }}</span>
      </div>
    </UFormField>

    <UFormField :label="t('admin.press.form.tagsLabel')">
      <USelectMenu
        v-model="tagIds"
        :items="tagItems"
        value-key="value"
        multiple
        class="w-full"
        :placeholder="t('admin.press.form.tagsPlaceholder')"
        :disabled="hasSupportError"
      />
    </UFormField>
  </div>
</template>
