<script setup lang="ts">
const props = defineProps<{
  pressDossierLink?: string | null
}>()

const {
  currentLocale,
  getLocaleIcon,
  isAdminUser,
  items,
  localeItems,
  mobileLocaleItems,
  selectedLocale,
} = usePublicHeaderNavigation(toRef(props, 'pressDossierLink'))

const { t } = useI18n()
</script>

<template>
  <UHeader
    id="main-navigation"
    :ui="{
      center: 'lg:hidden! xl:flex!',
      toggle: 'lg:inline-flex! xl:hidden!',
    }"
  >
    <template #title>
      <UColorModeImage
        light="/nav/creup-site-header-logo-light.svg"
        dark="/nav/creup-site-header-logo-dark.svg"
        :alt="t('accessibility.siteLogo')"
        class="h-8 w-auto"
      />
    </template>

    <UNavigationMenu
      content-orientation="vertical"
      :items="items"
      :aria-label="t('accessibility.mainNavigation')"
    />

    <template #body>
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        :aria-label="t('accessibility.mobileNavigation')"
      />
    </template>

    <template #right>
      <ClientOnly>
        <UTooltip v-if="isAdminUser" :text="t('nav.admin')">
          <UButton
            to="/admin"
            icon="i-tabler-settings-2"
            color="neutral"
            variant="ghost"
            :aria-label="t('nav.admin')"
          />
        </UTooltip>
      </ClientOnly>

      <UTooltip :text="t('theme.toggle')">
        <UColorModeButton />
      </UTooltip>

      <USelect
        v-model="selectedLocale"
        :items="localeItems"
        value-key="value"
        class="hidden w-36 sm:block"
        :aria-label="t('language.toggle')"
      >
        <template #leading="{ modelValue }">
          <UIcon v-if="modelValue" :name="getLocaleIcon(modelValue)" class="size-5" />
        </template>
      </USelect>

      <UDropdownMenu :items="mobileLocaleItems" class="sm:hidden">
        <UButton
          :icon="currentLocale?.icon"
          color="neutral"
          variant="ghost"
          size="lg"
          :aria-label="t('language.openMenu')"
        />
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
