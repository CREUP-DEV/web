<script setup lang="ts">
const { t } = useI18n()

const relatedSections = computed(() => [
  {
    key: 'members',
    to: '/conocenos/miembros',
    icon: 'i-tabler-users-group',
  },
  {
    key: 'team',
    to: '/conocenos/equipo',
    icon: 'i-tabler-user-heart',
  },
  {
    key: 'committees',
    to: '/conocenos/comites',
    icon: 'i-tabler-sitemap',
  },
  {
    key: 'events',
    to: '/conocenos/eventos',
    icon: 'i-tabler-calendar-event',
  },
])

const values = computed(() => [
  t('aboutPage.values.independence'),
  t('aboutPage.values.cooperation'),
  t('aboutPage.values.nonDiscrimination'),
  t('aboutPage.values.socialCommitment'),
  t('aboutPage.values.participation'),
])

useSeoMeta({
  title: () => t('nav.about.whatIs'),
  description: () => t('aboutPage.description'),
  ogTitle: () => t('nav.about.whatIs'),
  ogDescription: () => t('aboutPage.description'),
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-10">
      <header class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('aboutPage.title') }}</h1>
        <p class="text-muted mt-4 text-lg">{{ t('aboutPage.lead') }}</p>
      </header>

      <UCard>
        <div class="space-y-4 text-base leading-relaxed">
          <p>{{ t('aboutPage.intro') }}</p>

          <section aria-labelledby="about-activity">
            <h2 id="about-activity" class="text-lg font-semibold">
              {{ t('aboutPage.activityTitle') }}
            </h2>
            <p class="mt-2">{{ t('aboutPage.activityParagraph1') }}</p>
            <p class="mt-2">{{ t('aboutPage.activityParagraph2') }}</p>
          </section>

          <section aria-labelledby="about-collaboration">
            <h2 id="about-collaboration" class="text-lg font-semibold">
              {{ t('aboutPage.collaborationTitle') }}
            </h2>
            <p class="mt-2">{{ t('aboutPage.collaborationParagraph') }}</p>
          </section>

          <section aria-labelledby="about-purpose">
            <h2 id="about-purpose" class="text-lg font-semibold">
              {{ t('aboutPage.purposeTitle') }}
            </h2>
            <p class="mt-2">{{ t('aboutPage.purposeParagraph') }}</p>
          </section>
        </div>
      </UCard>

      <section class="grid gap-4 md:grid-cols-2">
        <UCard>
          <h2 class="text-xl font-semibold">{{ t('aboutPage.missionTitle') }}</h2>
          <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.missionText') }}</p>
        </UCard>

        <UCard>
          <h2 class="text-xl font-semibold">{{ t('aboutPage.visionTitle') }}</h2>
          <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.visionText') }}</p>
        </UCard>
      </section>

      <UCard>
        <h2 class="text-xl font-semibold">{{ t('aboutPage.valuesTitle') }}</h2>
        <ul class="mt-4 flex flex-wrap gap-2" :aria-label="t('aboutPage.valuesTitle')">
          <li v-for="value in values" :key="value">
            <UBadge color="neutral" variant="soft" size="lg">
              {{ value }}
            </UBadge>
          </li>
        </ul>
      </UCard>

      <section aria-labelledby="about-related-sections">
        <h2 id="about-related-sections" class="text-2xl font-semibold">
          {{ t('aboutPage.sectionsTitle') }}
        </h2>
        <p class="text-muted mt-2 max-w-3xl leading-relaxed">
          {{ t('aboutPage.sectionsDescription') }}
        </p>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <UCard
            v-for="section in relatedSections"
            :key="section.key"
            class="flex h-full flex-col justify-between"
          >
            <div>
              <UIcon :name="section.icon" class="text-primary mb-3 size-6" />
              <h3 class="text-lg font-semibold">
                {{ t(`aboutPage.sections.${section.key}.title`) }}
              </h3>
              <p class="text-muted mt-2 leading-relaxed">
                {{ t(`aboutPage.sections.${section.key}.description`) }}
              </p>
            </div>

            <UButton
              class="mt-5"
              :to="section.to"
              variant="soft"
              icon="i-tabler-arrow-right"
              trailing
              :label="t(`aboutPage.sections.${section.key}.cta`)"
            />
          </UCard>
        </div>
      </section>
    </article>
  </UContainer>
</template>
