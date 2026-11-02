<script setup lang="ts">
import {
  STUDENT_RIGHTS_PATH,
  STUDENT_RIGHTS_SECTIONS,
  STUDENT_RIGHTS_STATUTE_URL,
  type StudentRightText,
} from '~~/shared/constants/studentRightsGuide'
import { loadStudentRightsText } from '@/utils/studentRightsText'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const localePath = useLocalePath()

// The titles and explanations are data, not i18n messages (see `loadStudentRightsText`). Every
// section and right in the structure has an entry in each language, so there is no fallback to show.
type GuideText = Record<string, { title: string; rights: Record<string, StudentRightText> }>
const guideText = shallowRef<GuideText>(await loadStudentRightsText(locale.value, fallbackLocale))
watch(locale, async (newLocale) => {
  guideText.value = await loadStudentRightsText(newLocale, fallbackLocale)
})

usePageSeo('studentRights.title', 'studentRights.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.policy.label'), path: localePath(STUDENT_RIGHTS_PATH) },
    { name: t('nav.policy.rights'), path: localePath(STUDENT_RIGHTS_PATH) },
  ],
})

const sections = computed(() =>
  STUDENT_RIGHTS_SECTIONS.map((section, index) => {
    const text = guideText.value[section.key]!

    return {
      key: section.key,
      anchor: section.anchor,
      icon: section.icon,
      number: index + 1,
      title: text.title,
      rights: section.rights.map((rightKey) => ({ key: rightKey, ...text.rights[rightKey]! })),
    }
  })
)

const rightsTotal = computed(() =>
  sections.value.reduce((total, section) => total + section.rights.length, 0)
)

const stats = computed(() => [
  { key: 'rights', value: rightsTotal.value, label: t('studentRights.stats.rights') },
  { key: 'sections', value: sections.value.length, label: t('studentRights.stats.sections') },
])
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-6xl space-y-10">
      <header
        class="border-primary/20 from-primary/10 to-primary/5 overflow-hidden rounded-3xl border bg-linear-to-br p-6 sm:p-8 lg:p-10"
      >
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div class="max-w-3xl space-y-4">
            <p class="text-primary text-sm font-semibold tracking-wide uppercase">
              {{ t('studentRights.eyebrow') }}
            </p>
            <h1 class="text-3xl font-bold text-balance sm:text-4xl">
              {{ t('studentRights.title') }}
            </h1>
            <p class="text-toned text-lg leading-relaxed text-balance">
              {{ t('studentRights.lead') }}
            </p>
            <p class="text-muted flex items-start gap-1.5 text-sm">
              <UIcon name="i-tabler-gavel" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{{ t('studentRights.source') }}</span>
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <UButton
                :href="STUDENT_RIGHTS_STATUTE_URL"
                external
                target="_blank"
                rel="noopener noreferrer"
                icon="i-tabler-external-link"
                :label="t('studentRights.ctaStatute')"
              />
              <UButton
                href="#temas"
                variant="soft"
                color="neutral"
                icon="i-tabler-arrow-down"
                :label="t('studentRights.ctaRights')"
              />
            </div>
          </div>

          <dl class="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div
              v-for="stat in stats"
              :key="stat.key"
              class="bg-default/70 ring-default flex flex-col-reverse rounded-2xl px-5 py-4 ring-1 backdrop-blur-sm"
            >
              <dt class="text-muted text-sm">{{ stat.label }}</dt>
              <dd class="text-primary text-3xl font-bold tabular-nums">{{ stat.value }}</dd>
            </div>
          </dl>
        </div>
      </header>

      <UAlert
        color="info"
        variant="soft"
        icon="i-tabler-info-circle"
        :title="t('studentRights.notice.title')"
        :description="t('studentRights.notice.description')"
      />

      <section id="temas" aria-labelledby="student-rights-index-title" class="scroll-mt-24">
        <h2 id="student-rights-index-title" class="text-2xl font-semibold">
          {{ t('studentRights.indexTitle') }}
        </h2>

        <ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="section in sections" :key="section.key">
            <a
              :href="`#${section.anchor}`"
              class="group bg-default ring-default hover:bg-elevated focus-visible:ring-primary flex h-full items-center gap-3 rounded-xl p-4 ring-1 transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
              >
                <UIcon :name="section.icon" class="size-5" />
              </span>
              <span class="min-w-0">
                <span class="group-hover:text-primary block font-medium text-balance">
                  {{ section.title }}
                </span>
                <span class="text-muted block text-sm">
                  {{
                    t(
                      'studentRights.rightsCount',
                      { count: section.rights.length },
                      section.rights.length
                    )
                  }}
                </span>
              </span>
            </a>
          </li>
        </ul>
      </section>

      <section
        v-for="section in sections"
        :id="section.anchor"
        :key="section.key"
        :aria-labelledby="`${section.anchor}-title`"
        class="scroll-mt-24"
      >
        <header class="border-primary mb-6 flex items-center gap-3 border-b-2 pb-3">
          <span
            aria-hidden="true"
            class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
          >
            <UIcon :name="section.icon" class="size-5" />
          </span>
          <h2
            :id="`${section.anchor}-title`"
            class="flex items-baseline gap-2 text-2xl font-semibold text-balance"
          >
            <span class="text-primary tabular-nums">{{ section.number }}.</span>
            <span>{{ section.title }}</span>
          </h2>
        </header>

        <ul class="grid gap-4 md:grid-cols-2">
          <li v-for="right in section.rights" :key="right.key">
            <UCard :ui="{ root: 'h-full', body: 'flex h-full flex-col gap-3' }">
              <h3 class="text-lg leading-snug font-semibold text-balance">
                {{ right.title }}
              </h3>
              <p class="text-muted leading-relaxed">
                {{ right.description }}
              </p>
              <p class="text-muted mt-auto flex items-start gap-1.5 pt-1 text-xs">
                <UIcon name="i-tabler-gavel" class="mt-px size-4 shrink-0" aria-hidden="true" />
                <span>
                  <span class="sr-only">{{ t('studentRights.articleLabel') }}: </span>
                  {{ right.article }}
                </span>
              </p>
            </UCard>
          </li>
        </ul>
      </section>

      <UCard class="border-primary/20 from-primary/10 to-primary/5 bg-linear-to-br">
        <section
          aria-labelledby="student-rights-closing-title"
          class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="max-w-3xl space-y-2">
            <h2 id="student-rights-closing-title" class="text-2xl font-semibold">
              {{ t('studentRights.closing.title') }}
            </h2>
            <p class="text-muted leading-relaxed">
              {{ t('studentRights.closing.description') }}
            </p>
          </div>

          <UButton
            :href="STUDENT_RIGHTS_STATUTE_URL"
            external
            target="_blank"
            rel="noopener noreferrer"
            icon="i-tabler-external-link"
            :label="t('studentRights.closing.cta')"
            class="self-start lg:self-auto"
          />
        </section>
      </UCard>
    </article>
  </UContainer>
</template>
