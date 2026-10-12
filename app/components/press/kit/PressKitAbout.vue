<script setup lang="ts">
import { CREUP_STAT_ICONS } from '@/composables/about/useAboutPageData'
import { usePressKitAbout } from '@/composables/press/usePressKitContent'

const props = defineProps<{
  /** Member universities, or null when no count is available. */
  universities: number | null
  years: number
}>()

const { t } = useI18n()
const about = usePressKitAbout({
  universities: toRef(props, 'universities'),
  years: toRef(props, 'years'),
})

const stats = computed(() =>
  about.stats.value.map((stat) => ({ ...stat, icon: CREUP_STAT_ICONS[stat.key] }))
)
const paragraphs = about.paragraphs
</script>

<template>
  <div class="space-y-8">
    <ul
      class="grid gap-4 md:grid-cols-3 print:grid-cols-3"
      :aria-label="t('aboutPage.snapshotTitle')"
    >
      <li
        v-for="stat in stats"
        :key="stat.key"
        class="bg-default ring-default flex items-start gap-3 rounded-xl p-4 ring-1 print:break-inside-avoid"
      >
        <div
          class="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
          aria-hidden="true"
        >
          <UIcon :name="stat.icon" class="size-5" />
        </div>
        <div>
          <p class="text-2xl font-bold tabular-nums">{{ stat.value }}</p>
          <p class="text-muted mt-1 text-sm leading-relaxed">{{ stat.label }}</p>
        </div>
      </li>
    </ul>

    <div class="space-y-4 text-base leading-relaxed">
      <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
    </div>
  </div>
</template>
