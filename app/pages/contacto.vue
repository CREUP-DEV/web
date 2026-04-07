<script setup lang="ts">
import {
  CONTACT_FIELD_LIMITS,
  isValidOptionalContactPhone,
} from '~~/shared/utils/contactValidation'
import { isValidEmailAddress } from '~~/shared/utils/emailValidation'

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
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

usePageSeo('contactPage.seo.title', 'contactPage.seo.description')

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

const validations = computed(() => ({
  name: {
    valid:
      form.name.trim().length >= CONTACT_FIELD_LIMITS.name.min &&
      form.name.trim().length <= CONTACT_FIELD_LIMITS.name.max,
    error:
      form.name.trim().length === 0
        ? t('contactPage.form.errors.nameRequired')
        : form.name.trim().length < CONTACT_FIELD_LIMITS.name.min
          ? t('contactPage.form.errors.nameMin')
          : t('contactPage.form.errors.nameMax'),
  },
  email: {
    valid:
      form.email.trim().length <= CONTACT_FIELD_LIMITS.emailMax && isValidEmailAddress(form.email),
    error:
      form.email.trim().length === 0
        ? t('contactPage.form.errors.emailRequired')
        : t('contactPage.form.errors.emailInvalid'),
  },
  phone: {
    valid: !isPress.value || isValidOptionalContactPhone(form.phone),
    error: t('contactPage.form.errors.phoneInvalid'),
  },
  mediaName: {
    valid:
      !isPress.value ||
      (form.mediaName.trim().length >= 1 &&
        form.mediaName.trim().length <= CONTACT_FIELD_LIMITS.mediaNameMax),
    error:
      form.mediaName.trim().length === 0
        ? t('contactPage.form.errors.mediaNameRequired')
        : t('contactPage.form.errors.mediaNameMax'),
  },
  subject: {
    valid:
      form.subject.trim().length >= CONTACT_FIELD_LIMITS.subject.min &&
      form.subject.trim().length <= CONTACT_FIELD_LIMITS.subject.max,
    error:
      form.subject.trim().length === 0
        ? t('contactPage.form.errors.subjectRequired')
        : form.subject.trim().length < CONTACT_FIELD_LIMITS.subject.min
          ? t('contactPage.form.errors.subjectMin')
          : t('contactPage.form.errors.subjectMax'),
  },
  message: {
    valid:
      form.message.trim().length >= CONTACT_FIELD_LIMITS.message.min &&
      form.message.trim().length <= CONTACT_FIELD_LIMITS.message.max,
    error:
      form.message.trim().length === 0
        ? t('contactPage.form.errors.messageRequired')
        : form.message.trim().length < CONTACT_FIELD_LIMITS.message.min
          ? t('contactPage.form.errors.messageMin')
          : t('contactPage.form.errors.messageMax'),
  },
}))

type ValidatedField = 'name' | 'email' | 'phone' | 'mediaName' | 'subject' | 'message'

function shouldShowError(field: ValidatedField): boolean {
  return (touched[field] || formSubmitted.value) && !validations.value[field].valid
}

function getFieldError(field: ValidatedField): string | undefined {
  return shouldShowError(field) ? validations.value[field].error : undefined
}

const isFormValid = computed(() => Object.values(validations.value).every((v) => v.valid))

async function handleSubmit() {
  formSubmitted.value = true

  if (!isFormValid.value || isSubmitting.value) {
    // Focus first invalid field for a11y
    const firstInvalid = (Object.keys(validations.value) as ValidatedField[]).find(
      (k) => !validations.value[k].valid
    )
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus()
    }
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        contactType: contactType.value,
        name: form.name.trim(),
        email: form.email.trim(),
        ...(isPress.value && {
          phone: form.phone.trim() || undefined,
          mediaName: form.mediaName.trim(),
        }),
        subject: form.subject.trim(),
        message: form.message.trim(),
        website: form.website,
      },
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
    formSubmitted.value = false
    Object.keys(touched).forEach((k) => (touched[k as keyof typeof touched] = false))
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

          <UFormField :label="`${t('contactPage.form.name')} *`" :error="getFieldError('name')">
            <UInput
              id="contact-name"
              v-model="form.name"
              type="text"
              :placeholder="t('contactPage.form.namePlaceholder')"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('name') ? 'error' : undefined"
              class="w-full"
              @blur="touched.name = true"
            />
          </UFormField>

          <UFormField :label="`${t('contactPage.form.email')} *`" :error="getFieldError('email')">
            <UInput
              id="contact-email"
              v-model="form.email"
              type="email"
              :placeholder="t('contactPage.form.emailPlaceholder')"
              required
              :disabled="isSubmitting"
              :color="shouldShowError('email') ? 'error' : undefined"
              class="w-full"
              @blur="touched.email = true"
            />
          </UFormField>

          <Transition name="content-switch" mode="out-in">
            <div v-if="isPress" key="press-fields" class="space-y-6">
              <UFormField :label="t('contactPage.form.phone')" :error="getFieldError('phone')">
                <UInput
                  id="contact-phone"
                  v-model="form.phone"
                  type="tel"
                  :placeholder="t('contactPage.form.phonePlaceholder')"
                  :disabled="isSubmitting"
                  :color="shouldShowError('phone') ? 'error' : undefined"
                  class="w-full"
                  @blur="touched.phone = true"
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
                  @blur="touched.mediaName = true"
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
              @blur="touched.subject = true"
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
              @blur="touched.message = true"
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
