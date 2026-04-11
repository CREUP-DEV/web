<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import { newsletterSubscribeSchema } from '~~/shared/utils/newsletterValidation'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import * as turnstileComposable from '@/composables/useTurnstile'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const { fieldErrors, getFieldError: getValidationFieldError, validate } = useZodFormValidation()
const privacyPolicyPath = computed(() => `${localePath('/legal')}#privacidad`)
const showConfirmedMessage = computed(() => route.query.confirmed === '1')
const showAlreadyConfirmedMessage = computed(() => route.query.confirmed === 'already')
const showExpiredConfirmationMessage = computed(() => route.query.confirmed === 'expired')
const showInvalidConfirmationMessage = computed(() => route.query.confirmed === 'invalid')
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

usePageSeo('newsletterPage.seo.title', 'newsletterPage.seo.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.press.label'),
      path: localePath('/prensa/newsletter'),
    },
    {
      name: t('nav.press.newsletter'),
      path: localePath('/prensa/newsletter'),
    },
  ],
})

const form = reactive({
  consent: false,
  email: '',
  middleName: '',
})
const formStartedAt = ref(Date.now())
const runtimeConfig = useRuntimeConfig()
const turnstileSiteKey = computed(
  () => (runtimeConfig.public?.turnstileSiteKey as string | undefined) ?? ''
)
const turnstileEnabled = computed(() => (turnstileSiteKey.value?.trim().length ?? 0) > 0)
const turnstileTokenFieldId = 'newsletter-turnstile-token'
const {
  hasError: turnstileHasError,
  isReady: isTurnstileReady,
  reset: resetTurnstile,
  token,
} = turnstileComposable.useTurnstile({
  containerId: 'newsletter-turnstile',
  enabled: turnstileEnabled,
  siteKey: turnstileSiteKey,
})

const touched = reactive({
  consent: false,
  email: false,
})
const isSubmitting = ref(false)
const formSubmitted = ref(false)

const newsletterPayload = computed(() => ({
  consent: form.consent,
  email: form.email.trim(),
  middleName: form.middleName.trim() || undefined,
  startedAt: formStartedAt.value,
  turnstileToken: token.value || undefined,
}))

watchEffect(() => {
  validate(newsletterSubscribeSchema, newsletterPayload.value)
})

type NewsletterField = 'email' | 'consent' | 'turnstileToken'

const validationFieldOrder: NewsletterField[] = ['email', 'consent', 'turnstileToken']

function shouldShowError(field: NewsletterField): boolean {
  if (field === 'turnstileToken') {
    return (
      turnstileEnabled.value && (formSubmitted.value || turnstileHasError.value) && !token.value
    )
  }

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

  if (field === 'turnstileToken') {
    return t('newsletterPage.form.errors.turnstileRequired')
  }
}

const isFormValid = computed(() => Object.keys(fieldErrors.value).length === 0)

async function handleSubscribe() {
  formSubmitted.value = true

  if (isSubmitting.value) {
    return
  }

  const hasTurnstileToken = !turnstileEnabled.value || token.value.length > 0

  if (!isFormValid.value || !hasTurnstileToken) {
    const firstInvalid = validationFieldOrder.find((field) => {
      if (field === 'turnstileToken') {
        return turnstileEnabled.value && !token.value
      }

      return Boolean(getValidationFieldError(field))
    })
    if (firstInvalid) {
      if (firstInvalid === 'turnstileToken') {
        document.getElementById(turnstileTokenFieldId)?.scrollIntoView({ behavior: 'smooth' })
        return
      }

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
    form.consent = false
    form.email = ''
    form.middleName = ''
    formStartedAt.value = Date.now()
    resetTurnstile()
    formSubmitted.value = false
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

const {
  data,
  pending: archivePendingPage,
  error: archiveFetchError,
} = await useFetch<{
  items: Newsletter[]
  total: number
}>('/api/newsletter', { query: computed(() => ({ limit: LIMIT, offset: offset.value })) })
const newsletters = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const archiveError = computed(() => !!archiveFetchError.value)
const privacyAccordionItems = computed<AccordionItem[]>(() => [
  {
    label: t('newsletterPage.form.privacyInfoTitle'),
    icon: 'i-tabler-shield-lock',
    value: 'privacy-info',
  },
])

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
          showAlreadyConfirmedMessage ||
          showExpiredConfirmationMessage ||
          showInvalidConfirmationMessage ||
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
          v-if="showAlreadyConfirmedMessage"
          color="success"
          variant="soft"
          icon="i-tabler-mail-check"
          :title="t('newsletterPage.alreadyConfirmed.title')"
          :description="t('newsletterPage.alreadyConfirmed.description')"
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
          v-if="showInvalidConfirmationMessage"
          color="warning"
          variant="soft"
          icon="i-tabler-alert-triangle"
          :title="t('newsletterPage.confirmedInvalid.title')"
          :description="t('newsletterPage.confirmedInvalid.description')"
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
              <label for="newsletter-middleName">Middle name</label>
              <input
                id="newsletter-middleName"
                v-model="form.middleName"
                type="text"
                name="middleName"
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

            <UFormField
              v-if="turnstileEnabled"
              :label="`${t('newsletterPage.form.turnstile')} *`"
              :error="getFieldError('turnstileToken')"
            >
              <div
                id="newsletter-turnstile"
                :aria-describedby="turnstileTokenFieldId"
                class="min-h-17"
              />
              <p :id="turnstileTokenFieldId" class="text-muted mt-2 text-xs">
                {{
                  isTurnstileReady
                    ? t('newsletterPage.form.turnstileHelp')
                    : t('newsletterPage.form.turnstileLoading')
                }}
              </p>
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              block
              :loading="isSubmitting"
              :disabled="
                !isFormValid || isSubmitting || (turnstileEnabled && (!isTurnstileReady || !token))
              "
              icon="i-tabler-mail-plus"
            >
              {{
                isSubmitting ? t('newsletterPage.form.sending') : t('newsletterPage.form.submit')
              }}
            </UButton>

            <UAccordion
              :items="privacyAccordionItems"
              type="multiple"
              :ui="{
                root: 'rounded-xl',
                trigger: 'px-4 py-3 text-sm font-medium',
                body: 'px-4 pb-4 pt-0',
              }"
            >
              <template #body>
                <section class="text-dimmed space-y-2 text-sm">
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
              </template>
            </UAccordion>
          </form>
        </UCard>
      </section>

      <section ref="archiveRef" role="region" :aria-label="t('newsletterPage.archive.ariaLabel')">
        <h2 class="mb-6 text-2xl font-bold">
          {{ t('newsletterPage.archive.title') }}
        </h2>

        <UAlert
          v-if="archiveError"
          color="error"
          variant="soft"
          icon="i-tabler-alert-circle"
          :title="t('newsletterPage.archive.title')"
          :description="t('newsletterPage.form.errorGeneric')"
        />

        <div
          v-else-if="archivePendingPage"
          class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          <UCard
            v-for="index in 6"
            :key="index"
            class="motion-card flex flex-col items-center text-center"
          >
            <USkeleton class="mb-4 aspect-square w-full max-w-60 rounded-lg" />
            <USkeleton class="mb-3 h-7 w-40" />
            <USkeleton class="h-10 w-full" />
          </UCard>
        </div>

        <template v-else>
          <div v-if="newsletters.length === 0" class="text-muted py-12 text-center">
            {{ t('newsletterPage.archive.empty') }}
          </div>

          <template v-else>
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  loading="lazy"
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
        </template>
      </section>
    </div>
  </UContainer>
</template>
