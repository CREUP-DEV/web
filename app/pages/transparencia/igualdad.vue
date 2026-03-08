<script setup lang="ts">
type CommitmentKey = 'policy' | 'protocol' | 'communication' | 'visibility'
type ResourceKey = 'motion' | 'position' | 'guide' | 'protocol'
type ActionStepKey = 'safety' | 'notify' | 'details' | 'support'
type ScopeKey = 'gender' | 'lgbtiq' | 'ethnicity' | 'disability' | 'language' | 'institutional'

const { t } = useI18n()

const accentButtonClass =
  'bg-[#513269] text-white hover:bg-[#452a59] focus-visible:ring-2 focus-visible:ring-[#513269]/40 focus-visible:outline-none dark:bg-[#6d4a88] dark:hover:bg-[#7b5599]'

const commitments = computed(() => [
  {
    key: 'policy' as CommitmentKey,
    icon: 'i-tabler-scale',
  },
  {
    key: 'protocol' as CommitmentKey,
    icon: 'i-tabler-shield-check',
  },
  {
    key: 'communication' as CommitmentKey,
    icon: 'i-tabler-language',
  },
  {
    key: 'visibility' as CommitmentKey,
    icon: 'i-tabler-eye',
  },
])

const resources = computed(() => [
  {
    key: 'position' as ResourceKey,
    icon: 'i-tabler-scale',
    href: '/documentos/igualdad/posicionamiento-igualdad-diversidad.pdf',
  },
  {
    key: 'protocol' as ResourceKey,
    icon: 'i-tabler-shield-lock',
    href: '/documentos/igualdad/protocolo-acoso-discriminacion-creup.pdf',
  },
  {
    key: 'guide' as ResourceKey,
    icon: 'i-tabler-file-text',
    href: '/documentos/igualdad/guia-comunicacion-inclusiva.pdf',
  },
  {
    key: 'motion' as ResourceKey,
    icon: 'i-tabler-file-description',
    href: '/documentos/igualdad/mocion-apartado-integral-igualdad.pdf',
  },
])

const actionSteps = computed(() => [
  {
    key: 'safety' as ActionStepKey,
    icon: 'i-tabler-shield',
  },
  {
    key: 'notify' as ActionStepKey,
    icon: 'i-tabler-bell-ringing',
  },
  {
    key: 'details' as ActionStepKey,
    icon: 'i-tabler-notes',
  },
  {
    key: 'support' as ActionStepKey,
    icon: 'i-tabler-user-heart',
  },
])

const scopeItems = computed(() => [
  {
    key: 'gender' as ScopeKey,
    icon: 'i-tabler-venus',
  },
  {
    key: 'lgbtiq' as ScopeKey,
    icon: 'i-tabler-rainbow',
  },
  {
    key: 'ethnicity' as ScopeKey,
    icon: 'i-tabler-world',
  },
  {
    key: 'disability' as ScopeKey,
    icon: 'i-tabler-accessible',
  },
  {
    key: 'language' as ScopeKey,
    icon: 'i-tabler-language',
  },
  {
    key: 'institutional' as ScopeKey,
    icon: 'i-tabler-building-bank',
  },
])

useSeoMeta({
  title: () => t('equalityPage.title'),
  description: () => t('equalityPage.description'),
  ogTitle: () => t('equalityPage.title'),
  ogDescription: () => t('equalityPage.description'),
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-6xl space-y-10">
      <header
        class="overflow-hidden rounded-3xl border border-[rgba(81,50,105,0.16)] bg-[linear-gradient(135deg,rgba(81,50,105,0.14),rgba(81,50,105,0.04))] p-6 sm:p-8 lg:p-10 dark:border-[rgba(216,190,231,0.2)] dark:bg-[linear-gradient(135deg,rgba(81,50,105,0.32),rgba(81,50,105,0.14))]"
      >
        <div class="max-w-4xl space-y-4">
          <span
            class="inline-flex items-center rounded-full border border-[rgba(81,50,105,0.16)] bg-white/70 px-3 py-1 text-sm font-medium text-[#513269] backdrop-blur-sm dark:border-[rgba(216,190,231,0.18)] dark:bg-white/[0.08] dark:text-[#d8bee7]"
          >
            {{ t('equalityPage.eyebrow') }}
          </span>

          <div class="space-y-3">
            <h1 class="text-3xl font-bold text-balance sm:text-4xl">
              {{ t('equalityPage.title') }}
            </h1>
            <p class="text-toned text-lg leading-relaxed text-balance">
              {{ t('equalityPage.lead') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              href="#equality-documents"
              icon="i-tabler-arrow-down"
              :label="t('equalityPage.ctaDocuments')"
              :class="accentButtonClass"
            />
            <UButton
              to="/contacto"
              variant="soft"
              color="neutral"
              icon="i-tabler-mail"
              :label="t('equalityPage.ctaContact')"
            />
          </div>
        </div>
      </header>

      <section aria-labelledby="equality-commitments">
        <div class="max-w-3xl">
          <h2 id="equality-commitments" class="text-2xl font-semibold">
            {{ t('equalityPage.commitmentsTitle') }}
          </h2>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UCard v-for="item in commitments" :key="item.key" class="h-full">
            <div class="space-y-4">
              <span
                class="flex size-11 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
              >
                <UIcon :name="item.icon" class="size-5" />
              </span>

              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  {{ t(`equalityPage.commitments.${item.key}.title`) }}
                </h3>
                <p class="text-muted leading-relaxed">
                  {{ t(`equalityPage.commitments.${item.key}.description`) }}
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </section>

      <section id="equality-documents" aria-labelledby="equality-documents-title">
        <div class="max-w-3xl">
          <h2 id="equality-documents-title" class="text-2xl font-semibold">
            {{ t('equalityPage.resourcesTitle') }}
          </h2>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <UCard v-for="resource in resources" :key="resource.key" class="h-full">
            <div class="flex h-full flex-col gap-5">
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <span
                    class="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
                  >
                    <UIcon :name="resource.icon" class="size-5" />
                  </span>

                  <div class="min-w-0 space-y-2">
                    <h3 class="text-lg font-semibold text-balance">
                      {{ t(`equalityPage.resources.${resource.key}.title`) }}
                    </h3>
                    <p class="text-muted text-sm">
                      {{ t(`equalityPage.resources.${resource.key}.meta`) }}
                    </p>
                  </div>
                </div>

                <p class="text-muted leading-relaxed">
                  {{ t(`equalityPage.resources.${resource.key}.description`) }}
                </p>
              </div>

              <div class="mt-auto">
                <UButton
                  :href="resource.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon="i-tabler-file-download"
                  :label="t('equalityPage.openDocument')"
                  :aria-label="`${t('equalityPage.openDocument')}: ${t(`equalityPage.resources.${resource.key}.title`)}`"
                  :class="accentButtonClass"
                />
              </div>
            </div>
          </UCard>
        </div>
      </section>

      <section aria-labelledby="equality-action">
        <div class="max-w-3xl">
          <h2 id="equality-action" class="text-2xl font-semibold">
            {{ t('equalityPage.actionTitle') }}
          </h2>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <UCard v-for="step in actionSteps" :key="step.key" class="h-full">
            <div class="space-y-4">
              <span
                class="flex size-11 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
              >
                <UIcon :name="step.icon" class="size-5" />
              </span>

              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  {{ t(`equalityPage.actionSteps.${step.key}.title`) }}
                </h3>
                <p class="text-muted leading-relaxed">
                  {{ t(`equalityPage.actionSteps.${step.key}.description`) }}
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </section>

      <section aria-labelledby="equality-scope">
        <div class="max-w-3xl">
          <h2 id="equality-scope" class="text-2xl font-semibold">
            {{ t('equalityPage.scopeTitle') }}
          </h2>
        </div>

        <ul
          class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          :aria-label="t('equalityPage.scopeTitle')"
        >
          <li v-for="item in scopeItems" :key="item.key">
            <UCard class="h-full">
              <div class="flex items-center gap-3">
                <span
                  class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
                >
                  <UIcon :name="item.icon" class="size-5" />
                </span>
                <p class="font-medium">
                  {{ t(`equalityPage.scopeItems.${item.key}`) }}
                </p>
              </div>
            </UCard>
          </li>
        </ul>
      </section>

      <UCard
        class="border-[rgba(81,50,105,0.16)] bg-[linear-gradient(135deg,rgba(81,50,105,0.1),rgba(81,50,105,0.03))] dark:border-[rgba(216,190,231,0.18)] dark:bg-[linear-gradient(135deg,rgba(81,50,105,0.28),rgba(81,50,105,0.1))]"
      >
        <section
          aria-labelledby="equality-support"
          class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="max-w-3xl space-y-2">
            <h2 id="equality-support" class="text-2xl font-semibold">
              {{ t('equalityPage.supportTitle') }}
            </h2>
            <p class="text-muted leading-relaxed">
              {{ t('equalityPage.supportDescription') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              to="/contacto"
              icon="i-tabler-mail"
              :label="t('equalityPage.supportPrimary')"
              :class="accentButtonClass"
            />
            <UButton
              href="/documentos/igualdad/protocolo-acoso-discriminacion-creup.pdf"
              target="_blank"
              rel="noopener noreferrer"
              variant="soft"
              color="neutral"
              icon="i-tabler-file-download"
              :label="t('equalityPage.supportSecondary')"
            />
          </div>
        </section>
      </UCard>
    </article>
  </UContainer>
</template>
