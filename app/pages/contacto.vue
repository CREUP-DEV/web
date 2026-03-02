<script setup lang="ts">
/**
 * Public contact page with form and direct email link.
 * Uses Nuxt i18n for all user-facing text.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const privacyPolicyPath = computed(() => `${localePath('/legal')}#privacidad`)

useSeoMeta({
  title: () => t('contactPage.seo.title'),
  description: () => t('contactPage.seo.description'),
  ogTitle: () => t('contactPage.seo.title'),
  ogDescription: () => t('contactPage.seo.description'),
})

// Form state
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '', // Honeypot — hidden from real users
})

// Track fields the user has interacted with
const touched = reactive({
  name: false,
  email: false,
  subject: false,
  message: false,
})

const isSubmitting = ref(false)
const formSubmitted = ref(false)

// Field-level validation rules
const validations = computed(() => ({
  name: {
    valid: form.name.trim().length >= 2 && form.name.trim().length <= 100,
    error:
      form.name.trim().length === 0
        ? t('contactPage.form.errors.nameRequired')
        : form.name.trim().length < 2
          ? t('contactPage.form.errors.nameMin')
          : t('contactPage.form.errors.nameMax'),
  },
  email: {
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
    error:
      form.email.trim().length === 0
        ? t('contactPage.form.errors.emailRequired')
        : t('contactPage.form.errors.emailInvalid'),
  },
  subject: {
    valid: form.subject.trim().length >= 3 && form.subject.trim().length <= 200,
    error:
      form.subject.trim().length === 0
        ? t('contactPage.form.errors.subjectRequired')
        : form.subject.trim().length < 3
          ? t('contactPage.form.errors.subjectMin')
          : t('contactPage.form.errors.subjectMax'),
  },
  message: {
    valid: form.message.trim().length >= 10 && form.message.trim().length <= 5000,
    error:
      form.message.trim().length === 0
        ? t('contactPage.form.errors.messageRequired')
        : form.message.trim().length < 10
          ? t('contactPage.form.errors.messageMin')
          : t('contactPage.form.errors.messageMax'),
  },
}))

function shouldShowError(field: keyof typeof touched): boolean {
  return (touched[field] || formSubmitted.value) && !validations.value[field].valid
}

function getFieldError(field: keyof typeof touched): string | undefined {
  return shouldShowError(field) ? validations.value[field].error : undefined
}

const isFormValid = computed(() => Object.values(validations.value).every((v) => v.valid))

async function handleSubmit() {
  formSubmitted.value = true

  if (!isFormValid.value || isSubmitting.value) {
    // Focus first invalid field for a11y
    const firstInvalid = (
      Object.keys(validations.value) as (keyof typeof validations.value)[]
    ).find((k) => !validations.value[k].valid)
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
        name: form.name.trim(),
        email: form.email.trim(),
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

    // Reset
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    formSubmitted.value = false
    Object.keys(touched).forEach((k) => (touched[k as keyof typeof touched] = false))
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { message?: string }
      statusMessage?: string
      message?: string
    }
    const errorMsg =
      fetchError.data?.message ||
      fetchError.statusMessage ||
      fetchError.message ||
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
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('contactPage.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('contactPage.subtitle') }}
        </p>
      </div>

      <!-- Direct email -->
      <p class="text-muted mb-8 text-center">
        {{ t('contactPage.email') }}
        <a href="mailto:info@creup.es" class="text-primary font-semibold hover:underline"
          >info@creup.es</a
        >
      </p>

      <!-- Contact form -->
      <UCard>
        <form
          class="space-y-6"
          aria-describedby="contact-form-description"
          @submit.prevent="handleSubmit"
        >
          <p id="contact-form-description" class="sr-only">
            {{ t('contactPage.subtitle') }}
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

          <!-- Name -->
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

          <!-- Email -->
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

          <!-- Subject -->
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

          <!-- Message -->
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

          <!-- Submit -->
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

          <!-- Legal notice and data protection (first information layer) -->
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
