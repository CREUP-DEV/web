<script setup lang="ts">
export type AdminLocaleFillStatus = 'empty' | 'partial' | 'complete'

const props = defineProps<{
  /** Translation completeness per non-default locale, driving the status dot. */
  status?: Record<string, AdminLocaleFillStatus>
  /** Locales with a validation error, so a hidden tab still announces it. */
  invalidLocales?: string[]
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
const { localeConfigs, getLocaleFlag, getLocaleName, isDefaultLocale } = useLocales()

// Dot colour and screen-reader wording per translation state. A failed validation is shown as an
// icon rather than a fourth colour, so "not translated" and "broken" never read as the same mark.
const DOT: Record<AdminLocaleFillStatus, { class: string; labelKey: string }> = {
  empty: { class: 'bg-error', labelKey: 'admin.i18nTabs.noTranslation' },
  partial: { class: 'bg-warning', labelKey: 'admin.i18nTabs.partialTranslation' },
  complete: { class: 'bg-success', labelKey: 'admin.i18nTabs.hasTranslation' },
}

const tabs = computed(() =>
  localeConfigs.value.map((config) => {
    const isDefault = isDefaultLocale(config.code)
    const invalid = props.invalidLocales?.includes(config.code) ?? false

    return {
      code: config.code,
      label: getLocaleName(config.code),
      flag: getLocaleFlag(config.code),
      isDefault,
      invalid,
      // The base locale is mandatory and always filled in, so it carries no completeness dot.
      dot: isDefault ? null : (props.status?.[config.code] ?? 'empty'),
    }
  })
)

// Roving arrow-key navigation across the tablist.
const onKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

  event.preventDefault()
  const delta = event.key === 'ArrowRight' ? 1 : -1
  const next = (index + delta + tabs.value.length) % tabs.value.length
  model.value = tabs.value[next]!.code
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="t('admin.i18nTabs.label')"
    class="border-default bg-elevated/40 inline-flex max-w-full flex-wrap gap-0.5 rounded-md border p-0.5"
  >
    <button
      v-for="(tab, index) in tabs"
      :key="tab.code"
      type="button"
      role="tab"
      :aria-selected="model === tab.code"
      :tabindex="model === tab.code ? 0 : -1"
      class="focus-visible:ring-primary/60 relative flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      :class="
        model === tab.code
          ? 'bg-default text-highlighted shadow-sm'
          : 'text-muted hover:text-default'
      "
      @click="model = tab.code"
      @keydown="onKeydown($event, index)"
    >
      <UIcon :name="tab.flag" class="size-4 shrink-0" aria-hidden="true" />
      {{ tab.label }}
      <UIcon
        v-if="tab.invalid"
        name="i-tabler-alert-circle-filled"
        class="text-error size-4 shrink-0"
        :aria-label="t('admin.i18nTabs.hasErrors')"
        role="img"
      />
      <span
        v-else-if="tab.dot"
        class="size-1.5 shrink-0 rounded-full"
        :class="DOT[tab.dot].class"
        :aria-label="t(DOT[tab.dot].labelKey)"
        role="img"
      />
    </button>
  </div>
</template>
