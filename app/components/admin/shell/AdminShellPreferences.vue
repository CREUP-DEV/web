<script setup lang="ts">
import type { Locale } from 'vue-i18n'

/**
 * Everything an admin can set to their taste, in plain sight: the panel's language and its light
 * or dark theme. Every choice applies at once; nothing here needs saving.
 *
 * Admin locale lives in the URL prefix (`prefix_except_default`), so changing it navigates to the
 * same page under the other prefix, as the public header does — no cookie.
 */
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const colorMode = useColorMode()
const { localeConfigs, getLocaleName } = useLocales()

const COLOR_MODES = [
  { value: 'system', icon: 'i-tabler-device-desktop' },
  { value: 'light', icon: 'i-tabler-sun' },
  { value: 'dark', icon: 'i-tabler-moon' },
] as const

interface IconItem {
  value: string
  label: string
  icon: string
}

const languageItems = computed<IconItem[]>(() =>
  localeConfigs.value.map((config) => ({
    value: config.code,
    label: getLocaleName(config.code),
    icon: config.flag,
  }))
)

const themeItems = computed<IconItem[]>(() =>
  COLOR_MODES.map((mode) => ({
    value: mode.value,
    label: t(`admin.layout.themes.${mode.value}`),
    icon: mode.icon,
  }))
)

const languageModel = computed({
  get: () => locale.value as string,
  set: (value: unknown) => {
    if (typeof value !== 'string' || value === locale.value) return
    const targetPath = switchLocalePath(value as Locale)
    if (targetPath && targetPath !== route.fullPath) void navigateTo(targetPath)
  },
})

const themeModel = computed({
  get: () => colorMode.preference,
  set: (value: unknown) => {
    if (COLOR_MODES.some((mode) => mode.value === value)) {
      colorMode.preference = value as string
    }
  },
})

/** Choices side by side, each on one line, wrapping as a whole on a narrow screen. */
const choicesUi = {
  fieldset: 'flex-wrap gap-y-2',
  item: 'min-w-fit flex-1 items-center',
  label: 'whitespace-nowrap',
}

const iconOf = (item: unknown) => (item as IconItem).icon
const labelOf = (item: unknown) => (item as IconItem).label
</script>

<template>
  <div class="space-y-6">
    <URadioGroup
      v-model="languageModel"
      :legend="t('admin.layout.language')"
      :items="languageItems"
      orientation="horizontal"
      variant="card"
      :ui="choicesUi"
    >
      <template #label="{ item }">
        <span class="flex items-center gap-2">
          <UIcon :name="iconOf(item)" class="size-5 shrink-0" aria-hidden="true" />
          {{ labelOf(item) }}
        </span>
      </template>
    </URadioGroup>

    <URadioGroup
      v-model="themeModel"
      :legend="t('admin.layout.theme')"
      :items="themeItems"
      orientation="horizontal"
      variant="card"
      :ui="choicesUi"
    >
      <template #label="{ item }">
        <span class="flex items-center gap-2">
          <UIcon :name="iconOf(item)" class="size-5 shrink-0" aria-hidden="true" />
          {{ labelOf(item) }}
        </span>
      </template>
    </URadioGroup>
  </div>
</template>
