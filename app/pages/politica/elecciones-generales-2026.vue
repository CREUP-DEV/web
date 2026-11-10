<script setup lang="ts">
import {
  ELECTION_PROPOSALS_HIGHLIGHTS,
  ELECTION_PROPOSALS_PATH,
  ELECTION_PROPOSALS_SECTIONS,
  type ElectionProposalsText,
} from '~~/shared/constants/electionProposals'
import { loadElectionProposalsText } from '@/utils/electionProposalsText'

const { t, locale } = useI18n()
const { fallbackLocale } = useLocales()
const localePath = useLocalePath()

// The document is data, not i18n messages (see `loadElectionProposalsText`). Every block and
// proposal in the structure has an entry in each language, so there is no fallback to show.
const documentText = shallowRef<ElectionProposalsText>(
  await loadElectionProposalsText(locale.value, fallbackLocale)
)
watch(locale, async (newLocale) => {
  documentText.value = await loadElectionProposalsText(newLocale, fallbackLocale)
})

usePageSeo('electionProposals.seoTitle', 'electionProposals.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.policy.label'), path: localePath('/politica-universitaria') },
    { name: t('nav.policy.elections'), path: localePath(ELECTION_PROPOSALS_PATH) },
  ],
})

const contactPath = computed(() => localePath('/contacto'))

const sectionAnchors = Object.fromEntries(
  ELECTION_PROPOSALS_SECTIONS.map((section) => [section.key, section.anchor])
)

const sections = computed(() => {
  let proposalNumber = 0

  return ELECTION_PROPOSALS_SECTIONS.map((section, index) => {
    const text = documentText.value.sections[section.key]
    const proposals: Record<string, { title: string; description: string }> = text.proposals

    return {
      key: section.key,
      anchor: section.anchor,
      icon: section.icon,
      number: index + 1,
      title: text.title,
      context: text.context,
      proposals: section.proposals.map((proposalKey) => {
        proposalNumber += 1
        return { key: proposalKey, number: proposalNumber, ...proposals[proposalKey]! }
      }),
    }
  })
})

const proposalsTotal = computed(() =>
  sections.value.reduce((total, section) => total + section.proposals.length, 0)
)

const stats = computed(() => [
  { key: 'proposals', value: proposalsTotal.value, label: t('electionProposals.stats.proposals') },
  { key: 'sections', value: sections.value.length, label: t('electionProposals.stats.sections') },
])

const highlights = computed(() =>
  ELECTION_PROPOSALS_HIGHLIGHTS.map((highlight) => ({
    key: highlight.key,
    anchor: sectionAnchors[highlight.section],
    ...documentText.value.highlights[highlight.key],
  }))
)
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-6xl space-y-12">
      <header
        class="border-primary/20 from-primary/10 to-primary/5 overflow-hidden rounded-3xl border bg-linear-to-br p-6 sm:p-8 lg:p-10"
      >
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div class="max-w-3xl space-y-4">
            <p class="text-primary text-sm font-semibold tracking-wide uppercase">
              {{ t('electionProposals.eyebrow') }}
            </p>
            <h1 class="text-3xl font-bold text-balance sm:text-4xl lg:text-5xl">
              {{ t('electionProposals.title') }}
            </h1>
            <p class="text-toned text-lg leading-relaxed text-balance">
              {{ t('electionProposals.lead') }}
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <UButton
                href="#bloques"
                icon="i-tabler-arrow-down"
                :label="t('electionProposals.ctaProposals')"
              />
              <UButton
                :to="contactPath"
                variant="soft"
                color="neutral"
                icon="i-tabler-mail"
                :label="t('electionProposals.ctaContact')"
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

      <section aria-labelledby="election-proposals-highlights-title">
        <h2 id="election-proposals-highlights-title" class="text-2xl font-semibold">
          {{ t('electionProposals.highlightsTitle') }}
        </h2>

        <ul class="mt-6 grid gap-4 md:grid-cols-3">
          <li v-for="highlight in highlights" :key="highlight.key">
            <a
              :href="`#${highlight.anchor}`"
              class="group bg-default ring-default hover:bg-elevated focus-visible:ring-primary flex h-full flex-col gap-2 rounded-2xl p-5 ring-1 transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <span class="text-primary text-3xl font-bold tabular-nums sm:text-4xl">
                {{ highlight.value }}
              </span>
              <span class="text-muted group-hover:text-default leading-relaxed text-balance">
                {{ highlight.label }}
              </span>
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="election-proposals-intro-title" class="mx-auto max-w-3xl space-y-4">
        <h2 id="election-proposals-intro-title" class="text-2xl font-semibold">
          {{ t('electionProposals.introTitle') }}
        </h2>
        <p
          v-for="(paragraph, index) in documentText.intro"
          :key="index"
          class="text-toned leading-relaxed"
        >
          {{ paragraph }}
        </p>
      </section>

      <section id="bloques" aria-labelledby="election-proposals-index-title" class="scroll-mt-24">
        <h2 id="election-proposals-index-title" class="text-2xl font-semibold">
          {{ t('electionProposals.indexTitle') }}
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
                      'electionProposals.proposalsCount',
                      { count: section.proposals.length },
                      section.proposals.length
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
        class="scroll-mt-24 space-y-6"
      >
        <header class="border-primary flex items-center gap-3 border-b-2 pb-3">
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

        <div class="max-w-3xl space-y-4">
          <p
            v-for="(paragraph, index) in section.context"
            :key="index"
            class="text-toned leading-relaxed"
          >
            {{ paragraph }}
          </p>
        </div>

        <ul class="grid gap-4 md:grid-cols-2">
          <li v-for="proposal in section.proposals" :key="proposal.key">
            <UCard :ui="{ root: 'h-full', body: 'flex h-full flex-col gap-3' }">
              <div class="flex items-start gap-3">
                <span
                  class="bg-primary/10 text-primary mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-semibold tabular-nums"
                >
                  <span class="sr-only">
                    {{ t('electionProposals.proposalLabel', { number: proposal.number }) }}
                  </span>
                  <span aria-hidden="true">{{ proposal.number }}</span>
                </span>
                <h3 class="text-lg leading-snug font-semibold text-balance">
                  {{ proposal.title }}
                </h3>
              </div>
              <p class="text-muted leading-relaxed">
                {{ proposal.description }}
              </p>
            </UCard>
          </li>
        </ul>

        <p class="text-right">
          <a
            href="#bloques"
            class="text-muted hover:text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <UIcon name="i-tabler-arrow-up" class="size-4" aria-hidden="true" />
            {{ t('electionProposals.backToIndex') }}
          </a>
        </p>
      </section>

      <UCard class="border-primary/20 from-primary/10 to-primary/5 bg-linear-to-br">
        <section
          aria-labelledby="election-proposals-closing-title"
          class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center"
        >
          <div class="space-y-4">
            <h2 id="election-proposals-closing-title" class="text-2xl font-semibold text-balance">
              {{ t('electionProposals.closing.title') }}
            </h2>
            <p
              v-for="(paragraph, index) in documentText.closing"
              :key="index"
              class="text-toned leading-relaxed"
            >
              {{ paragraph }}
            </p>
          </div>

          <div class="bg-default/70 ring-default space-y-3 rounded-2xl p-5 ring-1">
            <h3 class="font-semibold text-balance">
              {{ t('electionProposals.closing.contactTitle') }}
            </h3>
            <p class="text-muted text-sm leading-relaxed">
              {{ t('electionProposals.closing.contactDescription') }}
            </p>
            <UButton
              :to="contactPath"
              icon="i-tabler-mail"
              :label="t('electionProposals.closing.cta')"
            />
          </div>
        </section>
      </UCard>
    </article>
  </UContainer>
</template>
