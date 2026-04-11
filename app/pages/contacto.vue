<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { CONTACT_FIELD_LIMITS, contactFormSchema } from '~~/shared/utils/contactValidation'

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const {
  fieldErrors,
  clearErrors,
  getFieldError: getValidationFieldError,
  validate,
} = useZodFormValidation()
const privacyPolicyPath = computed(() => `${localePath('/legal')}#privacidad`)
const {
  elRef: headerRef,
  isVisible: headerVisible,
  isPending: headerPending,
  shouldAnimate: headerShouldAnimate,
} = useEntranceObserver(0.12)
const {
  elRef: contactTypeRef,
  isVisible: contactTypeVisible,
  isPending: contactTypePending,
  shouldAnimate: contactTypeShouldAnimate,
} = useEntranceObserver(0.12)
const {
  elRef: emailRef,
  isVisible: emailVisible,
  isPending: emailPending,
  shouldAnimate: emailShouldAnimate,
} = useEntranceObserver(0.12)
const {
  elRef: formRef,
  isVisible: formVisible,
  isPending: formPending,
  shouldAnimate: formShouldAnimate,
} = useEntranceObserver(0.1)

usePageSeo('contactPage.seo.title', 'contactPage.seo.description', {
  webPageType: 'ContactPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.contact'),
      path: localePath('/contacto'),
    },
  ],
})

const contactType = ref<'general' | 'press'>('general')
const isPress = computed(() => contactType.value === 'press')
const displayEmail = computed(() => (isPress.value ? 'prensa@creup.es' : 'info@creup.es'))
const mailtoHref = computed(() => `mailto:${displayEmail.value}`)

const contactTypeItems = computed(() => [
  {
    label: t('contactPage.contactType.general'),
    value: 'general' as const,
  },
  {
    label: t('contactPage.contactType.press'),
    value: 'press' as const,
  },
])

const contactTypeDescription = computed(() =>
  isPress.value
    ? t('contactPage.contactType.pressDescription')
    : t('contactPage.contactType.generalDescription')
)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  mediaName: '',
  subject: '',
  message: '',
  website: '',
})

const contactPayload = computed(() => ({
  contactType: contactType.value,
  email: form.email.trim(),
  message: form.message.trim(),
  mediaName: form.mediaName.trim() || undefined,
  name: form.name.trim(),
  phone: form.phone.trim() || undefined,
  subject: form.subject.trim(),
  website: form.website.trim() || undefined,
}))

const touched = reactive({
  name: false,
  email: false,
  phone: false,
  mediaName: false,
  subject: false,
  message: false,
})

const isSubmitting = ref(false)
const formSubmitted = ref(false)

const hasAnyTouchedField = computed(() => Object.values(touched).some(Boolean))

watchDebounced(
  contactPayload,
  () => {
    if (formSubmitted.value || hasAnyTouchedField.value) {
      validate(contactFormSchema, contactPayload.value)
    }
  },
  { debounce: 250, maxWait: 800 }
)

type ValidatedField = 'name' | 'email' | 'phone' | 'mediaName' | 'subject' | 'message'

const validationFieldOrder = computed<ValidatedField[]>(() =>
  isPress.value
    ? ['name', 'email', 'phone', 'mediaName', 'subject', 'message']
    : ['name', 'email', 'phone', 'subject', 'message']
)

function shouldShowError(field: ValidatedField): boolean {
  return (touched[field] || formSubmitted.value) && !!getValidationFieldError(field)
}

function getFieldError(field: ValidatedField): string | undefined {
  if (!shouldShowError(field)) return undefined

  if (field === 'name') {
    return form.name.trim().length === 0
      ? t('contactPage.form.errors.nameRequired')
      : form.name.trim().length < CONTACT_FIELD_LIMITS.name.min
        ? t('contactPage.form.errors.nameMin')
        : t('contactPage.form.errors.nameMax')
  }

  if (field === 'email') {
    return form.email.trim().length === 0
      ? t('contactPage.form.errors.emailRequired')
      : t('contactPage.form.errors.emailInvalid')
  }

  if (field === 'phone') {
    return t('contactPage.form.errors.phoneInvalid')
  }

  if (field === 'mediaName') {
    return form.mediaName.trim().length === 0
      ? t('contactPage.form.errors.mediaNameRequired')
      : t('contactPage.form.errors.mediaNameMax')
  }

  if (field === 'subject') {
    return form.subject.trim().length === 0
      ? t('contactPage.form.errors.subjectRequired')
      : form.subject.trim().length < CONTACT_FIELD_LIMITS.subject.min
        ? t('contactPage.form.errors.subjectMin')
        : t('contactPage.form.errors.subjectMax')
  }

  return form.message.trim().length === 0
    ? t('contactPage.form.errors.messageRequired')
    : form.message.trim().length < CONTACT_FIELD_LIMITS.message.min
      ? t('contactPage.form.errors.messageMin')
      : t('contactPage.form.errors.messageMax')
}

const isFormValid = computed(() => Object.keys(fieldErrors.value).length === 0)

function markFieldTouched(field: keyof typeof touched) {
  touched[field] = true
  validate(contactFormSchema, contactPayload.value)
}

async function handleSubmit() {
  formSubmitted.value = true

  if (isSubmitting.value) {
    return
  }

  const isValid = validate(contactFormSchema, contactPayload.value)

  if (!isValid) {
    const firstInvalid = validationFieldOrder.value.find((field) => getValidationFieldError(field))

    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus()
    }
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: contactPayload.value,
    })

    toast.add({
      title: t('contactPage.form.success'),
      icon: 'i-tabler-check',
      color: 'success',
    })

    form.name = ''
    form.email = ''
    form.phone = ''
    form.mediaName = ''
    form.subject = ''
    form.message = ''
    form.website = ''
    formSubmitted.value = false
    Object.keys(touched).forEach((k) => (touched[k as keyof typeof touched] = false))
    clearErrors()
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { message?: string; statusMessage?: string }
    }
    const errorMsg =
      fetchError.data?.message ||
      fetchError.data?.statusMessage ||
      t('contactPage.form.errorGeneric')

    toast.add({
      title: errorMsg,
      icon: 'i-tabler-alert-circle',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-12">
    <section role="region" :aria-label="t('contactPage.title')" class="mx-auto max-w-2xl">
      <div
        ref="headerRef"
        class="mb-8 text-center"
        :class="entranceClasses(headerShouldAnimate, headerVisible, headerPending)"
        :style="entranceStyle(headerVisible, headerShouldAnimate, 0)"
      >
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('contactPage.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('contactPage.subtitle') }}
        </p>
      </div>

      <div
        ref="contactTypeRef"
        class="mb-8"
        :class="entranceClasses(contactTypeShouldAnimate, contactTypeVisible, contactTypePending)"
        :style="entranceStyle(contactTypeVisible, contactTypeShouldAnimate, 1)"
      >
        <UTabs v-model="contactType" :items="contactTypeItems" class="w-full" />
        <p class="text-muted mt-2 text-sm">{{ contactTypeDescription }}</p>
      </div>

      <p
        ref="emailRef"
        class="text-muted mb-8 text-center"
        :class="entranceClasses(emailShouldAnimate, emailVisible, emailPending)"
        :style="entranceStyle(emailVisible, emailShouldAnimate, 2)"
      >
        {{ t('contactPage.email') }}
        <a :href="mailtoHref" class="text-primary font-semibold hover:underline">{{
          displayEmail
        }}</a>
      </p>

      <UCard
        ref="formRef"
        class="motion-card-subtle"
        :class="entranceClasses(formShouldAnimate, formVisible, formPending)"
        :style="entranceStyle(formVisible, formShouldAnimate, 3)"
      >
        <form
          class="space-y-6"
          aria-describedby="contact-form-description"
          @submit.prevent="handleSubmit"
        >
          <p id="contact-form-description" class="sr-only">
            {{ t('contactPage.subtitle') }}
          </p>

          <div class="sr-only" aria-hidden="true">
            <input
              id="website"
              v-model="form.website"
              type="text"
              name="website"
              tabindex="-1"
              autocomplete="off"
            />
          </div>

          <UFormField :label="`${t('contactPage.form.name')} *`" :error="getFieldError('name')">
            <UInput
              id="contact-name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              :placeholder="t('contactPage.form.namePlaceholder')"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('name') ? 'error' : undefined"
              class="w-full"
              @blur="markFieldTouched('name')"
            />
          </UFormField>

          <UFormField :label="`${t('contactPage.form.email')} *`" :error="getFieldError('email')">
            <UInput
              id="contact-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              :placeholder="t('contactPage.form.emailPlaceholder')"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('email') ? 'error' : undefined"
              class="w-full"
              @blur="markFieldTouched('email')"
            />
          </UFormField>

          <Transition name="content-switch" mode="out-in">
            <div v-if="isPress" key="press-fields" class="space-y-6">
              <UFormField :label="t('contactPage.form.phone')" :error="getFieldError('phone')">
                <UInput
                  id="contact-phone"
                  v-model="form.phone"
                  type="tel"
                  autocomplete="tel"
                  :placeholder="t('contactPage.form.phonePlaceholder')"
                  :disabled="isSubmitting"
                  :color="shouldShowError('phone') ? 'error' : undefined"
                  class="w-full"
                  @blur="markFieldTouched('phone')"
                />
              </UFormField>

              <UFormField
                :label="`${t('contactPage.form.mediaName')} *`"
                :error="getFieldError('mediaName')"
              >
                <UInput
                  id="contact-mediaName"
                  v-model="form.mediaName"
                  type="text"
                  :placeholder="t('contactPage.form.mediaNamePlaceholder')"
                  required
                  :disabled="isSubmitting"
                  :color="shouldShowError('mediaName') ? 'error' : undefined"
                  class="w-full"
                  @blur="markFieldTouched('mediaName')"
                />
              </UFormField>
            </div>
          </Transition>

          <UFormField
            :label="`${t('contactPage.form.subject')} *`"
            :error="getFieldError('subject')"
          >
            <UInput
              id="contact-subject"
              v-model="form.subject"
              type="text"
              :placeholder="t('contactPage.form.subjectPlaceholder')"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('subject') ? 'error' : undefined"
              class="w-full"
              @blur="markFieldTouched('subject')"
            />
          </UFormField>

          <UFormField
            :label="`${t('contactPage.form.message')} *`"
            :error="getFieldError('message')"
          >
            <UTextarea
              id="contact-message"
              v-model="form.message"
              :placeholder="t('contactPage.form.messagePlaceholder')"
              :rows="5"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('message') ? 'error' : undefined"
              class="w-full"
              @blur="markFieldTouched('message')"
            />
            <template #hint>
              <span :class="form.message.trim().length < 10 ? 'text-error' : 'text-muted'">
                {{ form.message.trim().length }}/5000
              </span>
            </template>
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            block
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            icon="i-tabler-send"
          >
            {{ isSubmitting ? t('contactPage.form.sending') : t('contactPage.form.submit') }}
          </UButton>

          <div
            class="text-dimmed space-y-2 text-sm"
            :aria-label="t('contactPage.form.privacyInfoTitle')"
          >
            <p class="font-medium">
              {{ t('contactPage.form.privacyInfoTitle') }}
            </p>
            <ul class="list-disc space-y-1 pl-5">
              <li>{{ t('contactPage.form.privacyInfoController') }}</li>
              <li>{{ t('contactPage.form.privacyInfoPurpose') }}</li>
              <li>{{ t('contactPage.form.privacyInfoLegalBasis') }}</li>
              <li>{{ t('contactPage.form.privacyInfoRecipients') }}</li>
              <li>{{ t('contactPage.form.privacyInfoRetention') }}</li>
              <li>{{ t('contactPage.form.privacyInfoRights') }}</li>
            </ul>
            <p>
              {{ t('contactPage.form.privacyInfoMorePrefix') }}
              <NuxtLink
                :to="privacyPolicyPath"
                class="text-primary underline underline-offset-2 hover:no-underline"
              >
                {{ t('contactPage.form.privacyInfoMoreLink') }}
              </NuxtLink>
              .
            </p>
          </div>
        </form>
      </UCard>
    </section>
  </UContainer>
</template>
