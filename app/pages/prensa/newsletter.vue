<script setup lang="ts">
/**
 * Public newsletter page.
 * Displays a subscription form (at the top) and the archive of all
 * published newsletters (cover image + PDF download).
 */
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const privacyPolicyPath = computed(() => `${localePath('/legal')}#privacidad`)
const showConfirmedMessage = computed(() => route.query.confirmed === '1')
const showUnsubscribeMessage = computed(() => route.query.unsubscribed === '1')

useSeoMeta({
  title: () => t('newsletterPage.seo.title'),
  description: () => t('newsletterPage.seo.description'),
  ogTitle: () => t('newsletterPage.seo.title'),
  ogDescription: () => t('newsletterPage.seo.description'),
})

// ------------------------------------------------------------------
// Subscription form
// ------------------------------------------------------------------
const form = reactive({
  ageConfirmed: false,
  consent: false,
  email: '',
  website: '', // Honeypot
})

const touched = reactive({
  ageConfirmed: false,
  consent: false,
  email: false,
})
const isSubmitting = ref(false)
const formSubmitted = ref(false)

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
const consentValid = computed(() => form.consent === true)
const ageConfirmedValid = computed(() => form.ageConfirmed === true)

function getEmailError(): string | undefined {
  if (!(touched.email || formSubmitted.value) || emailValid.value) return undefined
  return form.email.trim().length === 0
    ? t('newsletterPage.form.errors.emailRequired')
    : t('newsletterPage.form.errors.emailInvalid')
}

function getConsentError(): string | undefined {
  if (!(touched.consent || formSubmitted.value) || consentValid.value) return undefined
  return t('newsletterPage.form.errors.consentRequired')
}

function getAgeConfirmedError(): string | undefined {
  if (!(touched.ageConfirmed || formSubmitted.value) || ageConfirmedValid.value) return undefined
  return t('newsletterPage.form.errors.ageConfirmedRequired')
}

async function handleSubscribe() {
  formSubmitted.value = true

  if (isSubmitting.value) {
    return
  }

  if (!emailValid.value) {
    document.getElementById('newsletter-email')?.focus()
    return
  }

  if (!consentValid.value) {
    document.getElementById('newsletter-consent')?.focus()
    return
  }

  if (!ageConfirmedValid.value) {
    document.getElementById('newsletter-age-confirmed')?.focus()
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/newsletter-subscribe', {
      method: 'POST',
      body: {
        ageConfirmed: form.ageConfirmed,
        consent: form.consent,
        email: form.email.trim(),
        website: form.website,
      },
    })
    toast.add({
      title: t('newsletterPage.form.pendingConfirmation'),
      icon: 'i-tabler-check',
      color: 'success',
    })
    form.ageConfirmed = false
    form.consent = false
    form.email = ''
    formSubmitted.value = false
    touched.ageConfirmed = false
    touched.consent = false
    touched.email = false
  } catch {
    toast.add({
      title: t('newsletterPage.form.errorGeneric'),
      icon: 'i-tabler-alert-circle',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

// ------------------------------------------------------------------
// Newsletter archive
// ------------------------------------------------------------------
interface Newsletter {
  id: string
  month: string
  coverImage: string
  pdfUrl: string
}

const { data } = await useFetch<{ items: Newsletter[] }>('/api/newsletter')
const newsletters = computed(() => data.value?.items ?? [])

function formatMonth(iso: string): string {
  const d = new Date(iso)
  const formatted = d.toLocaleDateString(t('newsletterPage.dateLocale'), {
    year: 'numeric',
    month: 'long',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-4xl">
      <!-- Header -->
      <div class="mb-10 text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('newsletterPage.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('newsletterPage.subtitle') }}
        </p>
      </div>

      <UAlert
        v-if="showConfirmedMessage"
        class="mx-auto mb-8 max-w-xl"
        color="success"
        variant="soft"
        icon="i-tabler-mail-check"
        :title="t('newsletterPage.confirmed.title')"
        :description="t('newsletterPage.confirmed.description')"
      />

      <UAlert
        v-if="showUnsubscribeMessage"
        class="mx-auto mb-8 max-w-xl"
        color="success"
        variant="soft"
        icon="i-tabler-mail-off"
        :title="t('newsletterPage.unsubscribe.title')"
        :description="t('newsletterPage.unsubscribe.description')"
      />

      <!-- Subscription form -->
      <section
        role="region"
        :aria-label="t('newsletterPage.form.ariaLabel')"
        class="mx-auto mb-14 max-w-xl"
      >
        <UCard>
          <form class="space-y-5" @submit.prevent="handleSubscribe">
            <p class="text-center text-lg font-semibold">
              {{ t('newsletterPage.form.heading') }}
            </p>

            <!-- Honeypot (hidden) -->
            <div class="sr-only" aria-hidden="true">
              <label for="website">Website</label>
              <input
                id="website"
                v-model="form.website"
                type="text"
                name="website"
                tabindex="-1"
                autocomplete="off"
              />
            </div>

            <!-- Email -->
            <UFormField :label="`${t('newsletterPage.form.email')} *`" :error="getEmailError()">
              <UInput
                id="newsletter-email"
                v-model="form.email"
                type="email"
                :placeholder="t('newsletterPage.form.emailPlaceholder')"
                required
                :disabled="isSubmitting"
                :color="getEmailError() ? 'error' : undefined"
                class="w-full"
                @blur="touched.email = true"
              />
            </UFormField>

            <UFormField :error="getConsentError()">
              <UCheckbox
                id="newsletter-consent"
                v-model="form.consent"
                required
                @change="touched.consent = true"
              >
                <template #label>
                  <span>
                    {{ t('newsletterPage.form.consentPrefix') }}
                    <NuxtLink
                      :to="privacyPolicyPath"
                      class="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {{ t('newsletterPage.form.consentLink') }}
                    </NuxtLink>
                    {{ t('newsletterPage.form.consentSuffix') }}
                  </span>
                </template>
              </UCheckbox>
            </UFormField>

            <UFormField :error="getAgeConfirmedError()">
              <UCheckbox
                id="newsletter-age-confirmed"
                v-model="form.ageConfirmed"
                required
                :label="t('newsletterPage.form.ageConfirmedLabel')"
                @change="touched.ageConfirmed = true"
              />
            </UFormField>

            <!-- Submit -->
            <UButton
              type="submit"
              color="primary"
              block
              :loading="isSubmitting"
              :disabled="!emailValid || !consentValid || !ageConfirmedValid || isSubmitting"
              icon="i-tabler-mail-plus"
            >
              {{
                isSubmitting ? t('newsletterPage.form.sending') : t('newsletterPage.form.submit')
              }}
            </UButton>

            <!-- Legal notice (first information layer) -->
            <section
              class="text-dimmed space-y-2 text-sm"
              :aria-label="t('newsletterPage.form.privacyInfoTitle')"
            >
              <p class="font-medium">
                {{ t('newsletterPage.form.privacyInfoTitle') }}
              </p>
              <ul class="list-disc space-y-1 pl-5">
                <li>{{ t('newsletterPage.form.privacyInfoController') }}</li>
                <li>{{ t('newsletterPage.form.privacyInfoPurpose') }}</li>
                <li>{{ t('newsletterPage.form.privacyInfoLegalBasis') }}</li>
                <li>{{ t('newsletterPage.form.privacyInfoRecipients') }}</li>
                <li>{{ t('newsletterPage.form.privacyInfoRetention') }}</li>
                <li>{{ t('newsletterPage.form.privacyInfoRights') }}</li>
              </ul>
              <p>
                {{ t('newsletterPage.form.privacyInfoMorePrefix') }}
                <NuxtLink
                  :to="privacyPolicyPath"
                  class="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {{ t('newsletterPage.form.privacyInfoMoreLink') }}
                </NuxtLink>
                .
              </p>
            </section>
          </form>
        </UCard>
      </section>

      <!-- Newsletter archive -->
      <section role="region" :aria-label="t('newsletterPage.archive.ariaLabel')">
        <h2 class="mb-6 text-2xl font-bold">
          {{ t('newsletterPage.archive.title') }}
        </h2>

        <div v-if="newsletters.length === 0" class="text-muted py-12 text-center">
          {{ t('newsletterPage.archive.empty') }}
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="nl in newsletters"
            :key="nl.id"
            class="flex flex-col items-center text-center"
          >
            <NuxtImg
              :src="nl.coverImage"
              :alt="formatMonth(nl.month)"
              width="240"
              height="240"
              class="mb-4 aspect-square w-full max-w-60 rounded-lg object-cover"
            />
            <p class="mb-3 text-lg font-semibold">{{ formatMonth(nl.month) }}</p>
            <UButton
              :href="nl.pdfUrl"
              external
              target="_blank"
              rel="noopener noreferrer"
              icon="i-tabler-download"
              variant="outline"
              block
              :aria-label="`${t('newsletterPage.archive.download')} — ${formatMonth(nl.month)}`"
            >
              {{ t('newsletterPage.archive.download') }}
            </UButton>
          </UCard>
        </div>
      </section>
    </div>
  </UContainer>
</template>
