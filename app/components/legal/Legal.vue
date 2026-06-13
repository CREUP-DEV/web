<script setup lang="ts">
defineProps<{
  title: string
}>()

const { t } = useI18n()

const principleKeys = [0, 1, 2, 3, 4, 5, 6] as const
const userRightKeys = [0, 1, 2, 3, 4, 5, 6] as const
const linkRuleKeys = [0, 1, 2] as const
</script>

<template>
  <article class="mx-auto max-w-4xl space-y-10">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold sm:text-4xl">
        {{ title }}
      </h1>
    </header>

    <section :id="t('legal.sections.general.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.general.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.general.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.general.p2') }}</p>

      <UCard variant="subtle" class="motion-card-subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span>{{ t('legal.general.address') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-tabler-mail" class="text-primary size-4 shrink-0" />
            <a
              href="mailto:info@creup.es"
              class="text-primary underline underline-offset-2 hover:no-underline"
              >info@creup.es</a
            >
          </div>
        </div>
      </UCard>
    </section>

    <USeparator />

    <section :id="t('legal.sections.terms.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.terms.heading') }}</h2>

      <h3 class="text-base font-semibold">{{ t('legal.terms.purpose.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.purpose.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.purpose.p2') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.purpose.p3') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.terms.user.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.user.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.user.p2') }}</p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>{{ t('legal.terms.user.items.0') }}</li>
        <li>{{ t('legal.terms.user.items.1') }}</li>
      </ul>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.user.p3') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.terms.user.p4') }}</p>
    </section>

    <USeparator />

    <section :id="t('legal.sections.warranties.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.warranties.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.warranties.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.warranties.p2') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.warranties.p3') }}</p>
    </section>

    <USeparator />

    <section :id="t('legal.sections.privacy.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.privacy.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.intro') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.framework.heading') }}</h3>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>{{ t('legal.privacy.framework.items.0') }}</li>
        <li>{{ t('legal.privacy.framework.items.1') }}</li>
        <li>{{ t('legal.privacy.framework.items.2') }}</li>
      </ul>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.controller.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.controller.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.record.heading') }}</h3>

      <!-- prettier-ignore -->
      <p class="text-sm leading-relaxed">{{ t('legal.privacy.record.a') }}<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline">aepd.es</a>{{ t('legal.privacy.record.b') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.principles.heading') }}</h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UCard
          v-for="key in principleKeys"
          :key="key"
          variant="subtle"
          class="motion-card-subtle"
          :ui="{ body: 'p-3' }"
        >
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-tabler-check" class="text-primary size-4 shrink-0" />
            <span>{{ t(`legal.privacy.principles.items.${key}`) }}</span>
          </div>
        </UCard>
      </div>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.categories.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.categories.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.legalBasis.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.legalBasis.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.purposes.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.purposes.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.analytics.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.analytics.p1') }}</p>

      <!-- prettier-ignore -->
      <p class="text-sm leading-relaxed">{{ t('legal.privacy.analytics.p2.a') }}<a href="https://docs.umami.is/docs" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline">docs.umami.is/docs</a>{{ t('legal.privacy.analytics.p2.b') }}<a href="https://umami.is/privacy" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline">umami.is/privacy</a>{{ t('legal.privacy.analytics.p2.c') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.retention.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.retention.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.recipients.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.recipients.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.minors.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.minors.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.security.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.security.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.rights.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.rights.intro') }}</p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li v-for="key in userRightKeys" :key="key">
          {{ t(`legal.privacy.rights.items.${key}`) }}
        </li>
      </ul>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.rights.exercise') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.thirdParty.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.thirdParty.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.complaints.heading') }}</h3>

      <!-- prettier-ignore -->
      <p class="text-sm leading-relaxed">{{ t('legal.privacy.complaints.a') }}<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:no-underline">aepd.es</a>{{ t('legal.privacy.complaints.b') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.privacy.acceptance.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.privacy.acceptance.body') }}</p>
    </section>

    <USeparator />

    <section :id="t('legal.sections.cookies.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.cookies.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.cookies.intro') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.cookies.used.heading') }}</h3>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">{{ t('legal.cookies.essential.title') }}</p>
            <UBadge color="primary" variant="subtle" size="sm">{{
              t('legal.cookies.essential.badge')
            }}</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">{{ t('legal.cookies.essential.intro') }}</p>

          <div class="divide-default space-y-2 divide-y">
            <div class="pt-2 first:pt-0">
              <!-- prettier-ignore -->
              <p class="font-medium">{{ t('legal.cookies.essential.lang.label.a') }}<code class="text-xs">user-locale</code>{{ t('legal.cookies.essential.lang.label.b') }}</p>
              <p class="text-muted text-xs">{{ t('legal.cookies.essential.lang.desc') }}</p>
            </div>
            <div class="pt-2">
              <p class="font-medium">{{ t('legal.cookies.essential.auth.label') }}</p>
              <p class="text-muted text-xs">{{ t('legal.cookies.essential.auth.desc') }}</p>
            </div>
            <div class="pt-2">
              <p class="font-medium">{{ t('legal.cookies.essential.prefs.label') }}</p>
              <!-- prettier-ignore -->
              <p class="text-muted text-xs">{{ t('legal.cookies.essential.prefs.desc.a') }}<code class="text-xs">nuxt-color-mode</code>{{ t('legal.cookies.essential.prefs.desc.b') }}<code class="text-xs">nuxt-a11y-*</code>{{ t('legal.cookies.essential.prefs.desc.c') }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">{{ t('legal.cookies.aggregate.title') }}</p>
            <UBadge color="neutral" variant="subtle" size="sm">{{
              t('legal.cookies.aggregate.badge')
            }}</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">{{ t('legal.cookies.aggregate.intro') }}</p>

          <div>
            <p class="font-medium">{{ t('legal.cookies.aggregate.umami.label') }}</p>
            <p class="text-muted text-xs">{{ t('legal.cookies.aggregate.umami.desc') }}</p>
          </div>
        </div>
      </UCard>

      <h3 class="text-base font-semibold">{{ t('legal.cookies.thirdParty.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.cookies.thirdParty.body') }}</p>

      <h3 class="text-base font-semibold">{{ t('legal.cookies.disable.heading') }}</h3>

      <p class="text-sm leading-relaxed">{{ t('legal.cookies.disable.body') }}</p>
    </section>

    <USeparator />

    <section :id="t('legal.sections.links.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.links.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.links.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.links.p2') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.links.p3') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.links.p4') }}</p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li v-for="key in linkRuleKeys" :key="key">{{ t(`legal.links.items.${key}`) }}</li>
      </ul>
    </section>

    <USeparator />

    <section :id="t('legal.sections.ip.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.ip.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.ip.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.ip.p2') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.ip.p3') }}</p>
    </section>

    <USeparator />

    <section :id="t('legal.sections.legalActions.id')" class="space-y-4">
      <h2 class="text-xl font-bold">{{ t('legal.legalActions.heading') }}</h2>

      <p class="text-sm leading-relaxed">{{ t('legal.legalActions.p1') }}</p>

      <p class="text-sm leading-relaxed">{{ t('legal.legalActions.p2') }}</p>
    </section>
  </article>
</template>
