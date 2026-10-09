<script setup lang="ts">
import { CREUP_VALUES } from '@/composables/about/useAboutPageData'

const { t } = useI18n()

const statements = computed(() => [
  {
    key: 'mission',
    icon: 'i-tabler-target-arrow',
    title: t('aboutPage.missionTitle'),
    text: t('aboutPage.missionText'),
  },
  {
    key: 'vision',
    icon: 'i-tabler-eye',
    title: t('aboutPage.visionTitle'),
    text: t('aboutPage.visionText'),
  },
])

const values = computed(() =>
  CREUP_VALUES.map(({ key, icon }) => ({
    key,
    icon,
    title: t(`aboutPage.values.${key}.title`),
    description: t(`aboutPage.values.${key}.description`),
  }))
)
</script>

<template>
  <div class="space-y-8">
    <div class="grid gap-4 md:grid-cols-2 print:grid-cols-2">
      <UCard
        v-for="statement in statements"
        :key="statement.key"
        class="border-l-primary border-l-4 print:break-inside-avoid"
      >
        <div class="flex items-start gap-3">
          <div
            class="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
            aria-hidden="true"
          >
            <UIcon :name="statement.icon" class="size-5" />
          </div>
          <div>
            <h3 class="text-xl font-semibold">{{ statement.title }}</h3>
            <p class="text-muted mt-2 leading-relaxed">{{ statement.text }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <div>
      <h3 class="text-xl font-semibold">{{ t('aboutPage.valuesTitle') }}</h3>
      <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.valuesDescription') }}</p>

      <ul class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 print:gap-3">
        <li
          v-for="value in values"
          :key="value.key"
          class="bg-default ring-default rounded-xl p-4 ring-1 print:break-inside-avoid"
        >
          <div
            class="bg-primary/8 text-primary flex size-10 items-center justify-center rounded-xl"
            aria-hidden="true"
          >
            <UIcon :name="value.icon" class="size-5" />
          </div>
          <h4 class="mt-3 font-semibold">{{ value.title }}</h4>
          <p class="text-muted mt-1 text-sm leading-relaxed">{{ value.description }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
