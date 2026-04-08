<script setup lang="ts">
import { newsletterSubscribeSchema } from '~~/shared/utils/newsletterValidation'
import { getApiErrorMessage } from '~~/shared/utils/apiError'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const { fieldErrors, getFieldError: getValidationFieldError, validate } = useZodFormValidation()
const privacyPolicyPath = computed(() => `${localePath('/legal')}#privacidad`)
const showConfirmedMessage = computed(() => route.query.confirmed === '1')
const showExpiredConfirmationMessage = computed(() => route.query.confirmed === 'expired')
const showUnsubscribeMessage = computed(() => route.query.unsubscribed === '1')
const showInvalidUnsubscribeMessage = computed(() => route.query.unsubscribed === 'invalid')
const {
  elRef: headerRef,
  isVisible: headerVisible,
  isPending: headerPending,
  shouldAnimate: headerShouldAnimate,
} = useEntranceObserver(0.12)
const {
  elRef: alertsRef,
  isVisible: alertsVisible,
  isPending: alertsPending,
  shouldAnimate: alertsShouldAnimate,
} = useEntranceObserver(0.12)
const {
  elRef: formRef,
  isVisible: formVisible,
  isPending: formPending,
  shouldAnimate: formShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: archiveRef,
  isVisible: archiveVisible,
  isPending: archivePending,
  shouldAnimate: archiveShouldAnimate,
} = useEntranceObserver(0.1)

usePageSeo('newsletterPage.seo.title', 'newsletterPage.seo.description')

const form = reactive({
  ageConfirmed: false,
  consent: false,
  email: '',
  website: '',
})

const touched = reactive({
  ageConfirmed: false,
  consent: false,
  email: false,
})
const isSubmitting = ref(false)
const formSubmitted = ref(false)

const newsletterPayload = computed(() => ({
  ageConfirmed: form.ageConfirmed,
  consent: form.consent,
  email: form.email.trim(),
  website: form.website.trim() || undefined,
}))

watchEffect(() => {
  validate(newsletterSubscribeSchema, newsletterPayload.value)
})

type NewsletterField = 'email' | 'consent' | 'ageConfirmed'

const validationFieldOrder: NewsletterField[] = ['email', 'consent', 'ageConfirmed']

function shouldShowError(field: NewsletterField): boolean {
  return (touched[field] || formSubmitted.value) && !!getValidationFieldError(field)
}

function getFieldError(field: NewsletterField): string | undefined {
  if (!shouldShowError(field)) return undefined

  if (field === 'email') {
    return form.email.trim().length === 0
      ? t('newsletterPage.form.errors.emailRequired')
      : t('newsletterPage.form.errors.emailInvalid')
  }

  if (field === 'consent') {
    return t('newsletterPage.form.errors.consentRequired')
  }

  return t('newsletterPage.form.errors.ageConfirmedRequired')
}

const isFormValid = computed(() => Object.keys(fieldErrors.value).length === 0)

async function handleSubscribe() {
  formSubmitted.value = true

  if (isSubmitting.value) {
    return
  }

  if (!isFormValid.value) {
    const firstInvalid = validationFieldOrder.find((field) => getValidationFieldError(field))
    if (firstInvalid) {
      document.getElementById(`newsletter-${firstInvalid}`)?.focus()
    }
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/newsletter-subscribe', {
      method: 'POST',
      body: newsletterPayload.value,
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
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('newsletterPage.form.errorGeneric')),
      icon: 'i-tabler-alert-circle',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

interface Newsletter {
  id: string
  month: string
  coverImage: string
  pdfUrl: string
}

const LIMIT = 12
const page = ref(1)
const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending: archivePendingPage } = await useFetch<{
  items: Newsletter[]
  total: number
}>('/api/newsletter', { query: computed(() => ({ limit: LIMIT, offset: offset.value })) })
const newsletters = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)

// Scroll back to archive heading when page changes
watch(page, () => {
  nextTick(() => {
    if (archiveRef.value instanceof HTMLElement) {
      archiveRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

function formatMonth(dateStr: string): string {
  // Parse as date-only parts to avoid UTC-offset day-rollback issues.
  const [yearStr, monthStr] = dateStr.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr) - 1
  const d = new Date(Date.UTC(year, month, 1))
  const formatted = d.toLocaleDateString(t('newsletterPage.dateLocale'), {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-4xl">
      <div
        ref="headerRef"
        class="mb-10 text-center"
        :class="entranceClasses(headerShouldAnimate, headerVisible, headerPending)"
        :style="entranceStyle(headerVisible, headerShouldAnimate, 0)"
      >
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('newsletterPage.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('newsletterPage.subtitle') }}
        </p>
      </div>

      <div
        v-if="
          showConfirmedMessage ||
          showExpiredConfirmationMessage ||
          showUnsubscribeMessage ||
          showInvalidUnsubscribeMessage
        "
        ref="alertsRef"
        class="mx-auto mb-8 max-w-xl space-y-4"
        :class="entranceClasses(alertsShouldAnimate, alertsVisible, alertsPending)"
        :style="entranceStyle(alertsVisible, alertsShouldAnimate, 1)"
      >
        <UAlert
          v-if="showConfirmedMessage"
          color="success"
          variant="soft"
          icon="i-tabler-mail-check"
          :title="t('newsletterPage.confirmed.title')"
          :description="t('newsletterPage.confirmed.description')"
        />

        <UAlert
          v-if="showExpiredConfirmationMessage"
          color="warning"
          variant="soft"
          icon="i-tabler-mail-x"
          :title="t('newsletterPage.confirmedExpired.title')"
          :description="t('newsletterPage.confirmedExpired.description')"
        />

        <UAlert
          v-if="showUnsubscribeMessage"
          color="success"
          variant="soft"
          icon="i-tabler-mail-off"
          :title="t('newsletterPage.unsubscribe.title')"
          :description="t('newsletterPage.unsubscribe.description')"
        />

        <UAlert
          v-if="showInvalidUnsubscribeMessage"
          color="warning"
          variant="soft"
          icon="i-tabler-alert-triangle"
          :title="t('newsletterPage.unsubscribeInvalid.title')"
          :description="t('newsletterPage.unsubscribeInvalid.description')"
        />
      </div>

      <section
        ref="formRef"
        role="region"
        :aria-label="t('newsletterPage.form.ariaLabel')"
        class="mx-auto mb-14 max-w-xl"
        :class="entranceClasses(formShouldAnimate, formVisible, formPending)"
        :style="entranceStyle(formVisible, formShouldAnimate, 2)"
      >
        <UCard class="motion-card-subtle">
          <form class="space-y-5" @submit.prevent="handleSubscribe">
            <p class="text-center text-lg font-semibold">
              {{ t('newsletterPage.form.heading') }}
            </p>

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

            <UFormField
              :label="`${t('newsletterPage.form.email')} *`"
              :error="getFieldError('email')"
            >
              <UInput
                id="newsletter-email"
                v-model="form.email"
                type="email"
                :placeholder="t('newsletterPage.form.emailPlaceholder')"
                required
                :disabled="isSubmitting"
                :color="shouldShowError('email') ? 'error' : undefined"
                class="w-full"
                @blur="touched.email = true"
              />
            </UFormField>

            <UFormField :error="getFieldError('consent')">
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

            <UFormField :error="getFieldError('ageConfirmed')">
              <UCheckbox
                id="newsletter-age-confirmed"
                v-model="form.ageConfirmed"
                required
                :label="t('newsletterPage.form.ageConfirmedLabel')"
                @change="touched.ageConfirmed = true"
              />
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              block
              :loading="isSubmitting"
              :disabled="!isFormValid || isSubmitting"
              icon="i-tabler-mail-plus"
            >
              {{
                isSubmitting ? t('newsletterPage.form.sending') : t('newsletterPage.form.submit')
              }}
            </UButton>

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

      <section ref="archiveRef" role="region" :aria-label="t('newsletterPage.archive.ariaLabel')">
        <h2 class="mb-6 text-2xl font-bold">
          {{ t('newsletterPage.archive.title') }}
        </h2>

        <div
          v-if="newsletters.length === 0 && !archivePendingPage"
          class="text-muted py-12 text-center"
        >
          {{ t('newsletterPage.archive.empty') }}
        </div>

        <template v-else>
          <div
            class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            :class="archivePendingPage ? 'pointer-events-none opacity-50' : ''"
          >
            <UCard
              v-for="(nl, index) in newsletters"
              :key="nl.id"
              class="motion-card flex flex-col items-center text-center"
              :class="entranceClasses(archiveShouldAnimate, archiveVisible, archivePending)"
              :style="entranceStyle(archiveVisible, archiveShouldAnimate, index, 70)"
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

          <div v-if="total > LIMIT" class="mt-8 flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
          </div>
        </template>
      </section>
    </div>
  </UContainer>
</template>
