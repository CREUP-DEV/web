<script setup lang="ts">
const props = defineProps<{
  pressDossierLink?: string | null
}>()

const {
  currentLocale,
  getLocaleIcon,
  items,
  localeItems,
  mobileContactLink,
  mobileLocaleItems,
  mobilePrimaryLinks,
  mobileSections,
  selectedLocale,
} = usePublicHeaderNavigation(toRef(props, 'pressDossierLink'))

const { t } = useI18n()
const socials = useSocials()
const instagramSocial = computed(() =>
  socials.value.find((social) => social.icon === 'i-tabler-brand-instagram')
)
const navigationMenuKey = computed(() => `public-nav:${props.pressDossierLink ?? 'none'}`)
const menuOpen = ref(false)
const mobileOpenSections = ref<string[]>([])
const getMobilePrimaryIconClass = (isActive?: boolean) =>
  isActive ? 'bg-primary/12 text-primary' : 'bg-primary/10 text-primary'
const getMobileChildIconClass = (isActive?: boolean) =>
  isActive ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'

watch(menuOpen, (isOpen) => {
  if (!isOpen || import.meta.server) {
    return
  }

  mobileOpenSections.value = mobileSections.value
    .filter((section) => section.active)
    .map((section) => section.value)

  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement || activeElement instanceof SVGElement) {
    activeElement.blur()
  }
})
</script>

<template>
  <UHeader
    id="main-navigation"
    v-model:open="menuOpen"
    mode="slideover"
    :toggle="{
      color: 'neutral',
      variant: 'ghost',
      size: 'lg',
    }"
    :ui="{
      center: 'hidden xl:flex!',
      toggle: 'xl:hidden',
    }"
  >
    <template #title>
      <img
        src="/nav/creup-site-header-logo-light.svg"
        :alt="t('accessibility.siteLogo')"
        width="144"
        height="32"
        class="h-8 w-auto dark:hidden"
      />
      <img
        src="/nav/creup-site-header-logo-dark.svg"
        :alt="t('accessibility.siteLogo')"
        width="144"
        height="32"
        class="hidden h-8 w-auto dark:block"
      />
    </template>

    <UNavigationMenu
      :key="navigationMenuKey"
      content-orientation="vertical"
      :items="items"
      :aria-label="t('accessibility.mainNavigation')"
    />

    <template #right>
      <LazyAdminNavShortcut :label="t('nav.admin')" :tooltip="t('nav.admin')" class="shrink-0" />

      <UTooltip v-if="instagramSocial" :text="t('social.followInstagram')">
        <UButton
          :icon="instagramSocial.icon"
          color="neutral"
          variant="ghost"
          :to="instagramSocial.to"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="instagramSocial.label"
          :ui="{ leadingIcon: 'size-5.5' }"
        />
      </UTooltip>

      <UTooltip :text="t('theme.toggle')">
        <UColorModeButton />
      </UTooltip>

      <USelect
        v-model="selectedLocale"
        :items="localeItems"
        value-key="value"
        class="hidden w-36 xl:block"
        :aria-label="t('language.toggle')"
      >
        <template #leading="{ modelValue }">
          <UIcon v-if="modelValue" :name="getLocaleIcon(modelValue)" class="size-5" />
        </template>
      </USelect>

      <UDropdownMenu :items="mobileLocaleItems" class="xl:hidden">
        <UButton
          :icon="currentLocale?.icon"
          color="neutral"
          variant="ghost"
          size="lg"
          :aria-label="t('language.openMenu')"
        />
      </UDropdownMenu>
    </template>

    <template #body>
      <div class="px-4 py-4">
        <div class="space-y-3">
          <div class="grid gap-3">
            <UButton
              v-for="link in mobilePrimaryLinks"
              :key="link.to"
              :to="link.to"
              color="neutral"
              variant="ghost"
              block
              class="ring-default/70 text-highlighted hover:bg-muted/50 justify-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold ring-1 ring-inset"
            >
              <template #leading>
                <span
                  :class="getMobilePrimaryIconClass(link.active)"
                  class="flex size-9 items-center justify-center rounded-xl"
                >
                  <UIcon :name="link.icon" class="size-4.5" />
                </span>
              </template>
              {{ link.label }}
            </UButton>
          </div>

          <UAccordion
            v-model="mobileOpenSections"
            :items="mobileSections"
            type="multiple"
            :ui="{
              root: 'space-y-3',
              item: 'overflow-visible rounded-2xl bg-muted/20 ring-1 ring-inset ring-default/70',
              trigger:
                'rounded-2xl px-4 py-3.5 text-sm font-semibold text-highlighted hover:bg-muted/60',
              body: 'px-2 pb-2 pt-2',
              label: 'tracking-[0.01em]',
            }"
          >
            <template #leading="{ item }">
              <span
                class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl"
              >
                <UIcon :name="item.icon" class="size-4.5" />
              </span>
            </template>

            <template #body="{ item }">
              <div class="grid gap-1 pb-2">
                <UButton
                  v-for="link in item.links"
                  :key="`${item.value}-${link.to}`"
                  :to="link.external ? undefined : link.to"
                  :href="link.external ? link.to : undefined"
                  :external="link.external || undefined"
                  :target="link.target"
                  :rel="link.rel"
                  color="neutral"
                  :variant="link.active ? 'soft' : 'ghost'"
                  block
                  class="justify-start gap-3 rounded-xl px-3 py-2.5 pl-4 text-sm"
                >
                  <template #leading>
                    <span
                      :class="getMobileChildIconClass(link.active)"
                      class="flex size-8 items-center justify-center rounded-lg"
                    >
                      <UIcon :name="link.icon" class="size-4" />
                    </span>
                  </template>
                  {{ link.label }}
                </UButton>
              </div>
            </template>
          </UAccordion>

          <UButton
            :to="mobileContactLink.to"
            color="neutral"
            variant="ghost"
            block
            class="ring-default/70 text-highlighted hover:bg-muted/50 justify-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold ring-1 ring-inset"
          >
            <template #leading>
              <span
                :class="getMobilePrimaryIconClass(mobileContactLink.active)"
                class="flex size-9 items-center justify-center rounded-xl"
              >
                <UIcon :name="mobileContactLink.icon" class="size-4.5" />
              </span>
            </template>
            {{ mobileContactLink.label }}
          </UButton>
        </div>

        <div class="border-default mt-5 flex items-center gap-3 border-t pt-5">
          <LazyAdminNavShortcut :label="t('nav.admin')" />

          <USelect
            v-model="selectedLocale"
            :items="localeItems"
            value-key="value"
            class="min-w-32 flex-1"
            :aria-label="t('language.toggle')"
          >
            <template #leading="{ modelValue }">
              <UIcon v-if="modelValue" :name="getLocaleIcon(modelValue)" class="size-5" />
            </template>
          </USelect>

          <UColorModeButton />
        </div>
      </div>
    </template>
  </UHeader>
</template>
