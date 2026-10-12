<script setup lang="ts">
import {
  CREUP_REPRESENTED_STUDENTS,
  CREUP_STAT_ICONS,
  FALLBACK_MEMBER_COUNT,
  FALLBACK_MEMBER_COUNT_LABEL,
  type CreupStatKey,
} from '@/composables/about/useAboutPageData'

const props = defineProps<{
  /** Member universities, or null when no count is available. */
  universities: number | null
  years: number
}>()

const { t, locale } = useI18n()
const { getLanguageTag } = useLocales()

const numberFormat = computed(() => new Intl.NumberFormat(getLanguageTag(locale.value)))
const formattedStudents = computed(() => numberFormat.value.format(CREUP_REPRESENTED_STUDENTS))
const formattedYears = computed(() => numberFormat.value.format(props.years))
// Without a count, the tile shows the "+30" label and the prose says "more than 30".
const formattedUniversities = computed(() =>
  numberFormat.value.format(props.universities ?? FALLBACK_MEMBER_COUNT)
)

const stats = computed(() =>
  (
    [
      {
        key: 'universities',
        value:
          props.universities === null ? FALLBACK_MEMBER_COUNT_LABEL : formattedUniversities.value,
      },
      { key: 'students', value: `+${formattedStudents.value}` },
      {
        key: 'years',
        value: `${formattedYears.value} ${t('aboutPage.stats.years.suffix')}`,
      },
    ] satisfies Array<{ key: CreupStatKey; value: string }>
  ).map((stat) => ({
    ...stat,
    label: t(`aboutPage.stats.${stat.key}.label`),
    icon: CREUP_STAT_ICONS[stat.key],
  }))
)

const paragraphs = computed(() => [
  t(props.universities === null ? 'pressKit.about.paragraph1Approx' : 'pressKit.about.paragraph1', {
    universities: formattedUniversities.value,
    students: formattedStudents.value,
    years: formattedYears.value,
  }),
  t('pressKit.about.paragraph2'),
  t('pressKit.about.paragraph3'),
  t('pressKit.about.paragraph4'),
])
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
