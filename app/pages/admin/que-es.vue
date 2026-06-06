<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { updateAboutPageContentSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Qué es CREUP',
})

interface AboutContent {
  id: string
  heroImage: string | null
  heroVisible: boolean
  updatedAt: string
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshAboutPage } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  data: contentData,
  error: contentError,
  pending: contentPending,
  refresh: refreshContent,
} = await useFetch<{
  data: AboutContent | null
}>('/api/admin/about', {
  headers: localeApiHeaders,
})

const contentItem = computed(() => contentData.value?.data ?? null)

const contentForm = reactive({
  heroImage: null as string | null,
  heroVisible: false,
})

const buildContentSnapshot = () =>
  JSON.stringify({
    heroImage: contentForm.heroImage,
    heroVisible: contentForm.heroVisible,
  })

const isSavingContent = ref(false)
const showClearHeroModal = ref(false)
const heroImageVersion = ref<number | null>(null)
const heroUpload = useAdminFileUpload({
  endpoint: '/api/admin/about/upload',
  successMessage: t('admin.about.uploadSuccess'),
  errorMessage: t('admin.about.uploadError'),
  onUploaded: (storagePath) => {
    clearErrors()
    contentForm.heroImage = storagePath
    contentForm.heroVisible = true
    heroImageVersion.value = Date.now()
  },
  getFallbackPreview: () => contentForm.heroImage,
})

const withCacheBuster = (url: string | null, version: number | null) => {
  if (!url || !version || !url.startsWith('/')) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
const heroPreview = computed(
  () => heroUpload.preview.value || withCacheBuster(contentForm.heroImage, heroImageVersion.value)
)
const currentHeroName = computed(() => contentForm.heroImage?.split('/').pop() ?? null)
const { hasFormChanges: hasPendingHeroChanges, resetFormSnapshot: resetContentSnapshot } =
  useFormSnapshot(buildContentSnapshot)

watch(
  contentItem,
  (item) => {
    contentForm.heroImage = item?.heroImage ?? null
    contentForm.heroVisible = item?.heroVisible ?? false
    heroUpload.setPreview(null)
    clearErrors()
    resetContentSnapshot()
  },
  { immediate: true }
)

const triggerHeroUpload = () => {
  heroUpload.triggerFileDialog()
}

const discardPendingHero = () => {
  contentForm.heroImage = contentItem.value?.heroImage ?? null
  contentForm.heroVisible = contentItem.value?.heroVisible ?? false
  heroUpload.setPreview(null)
  clearErrors()
}

const clearHero = () => {
  contentForm.heroImage = null
  contentForm.heroVisible = false
  heroImageVersion.value = null
  heroUpload.setPreview(null)
  clearErrors()
}

const requestClearHero = () => {
  showClearHeroModal.value = true
}

const confirmClearHero = () => {
  clearHero()
  showClearHeroModal.value = false
}

const saveContent = async () => {
  const payload = {
    heroImage: contentForm.heroImage,
    heroVisible: contentForm.heroVisible,
  }

  if (!hasPendingHeroChanges.value) {
    return
  }

  if (!validate(updateAboutPageContentSchema, payload)) {
    return
  }

  isSavingContent.value = true

  try {
    await $fetch('/api/admin/about', {
      method: 'PUT',
      body: {
        ...payload,
        updatedAt: contentItem.value?.updatedAt,
      },
    })

    await refreshContent()
    await refreshAboutPage()
    heroUpload.setPreview(null)
    toast.add({ title: t('admin.about.saveSuccess'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.about.saveError')),
      color: 'error',
    })
  } finally {
    isSavingContent.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <section>
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.about.title') }}</h1>
        <p class="text-muted mt-1 text-sm">{{ t('admin.about.subtitle') }}</p>
      </div>
    </section>

    <div v-if="contentPending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-72 w-full rounded-2xl" />
      <USkeleton class="h-10 w-40 rounded-lg" />
      <USkeleton class="h-10 w-32 rounded-lg" />
    </div>

    <div v-else-if="contentError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.about.loadError')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshContent()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <UCard v-else>
      <div class="space-y-6">
        <div class="bg-muted aspect-1925/550 overflow-hidden rounded-2xl border">
          <img
            v-if="heroPreview"
            :src="heroPreview"
            :alt="t('admin.about.heroPreviewAlt')"
            class="size-full object-cover"
          />
          <div v-else class="text-muted flex size-full items-center justify-center text-sm">
            {{ t('admin.about.noBannerUploaded') }}
          </div>
        </div>

        <div class="rounded-2xl border p-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="
                    contentForm.heroImage
                      ? contentForm.heroVisible
                        ? 'success'
                        : 'neutral'
                      : 'warning'
                  "
                  variant="subtle"
                  size="sm"
                >
                  {{
                    !contentForm.heroImage
                      ? t('admin.about.noBanner')
                      : contentForm.heroVisible
                        ? t('admin.about.visible')
                        : t('admin.about.hidden')
                  }}
                </UBadge>
                <UBadge v-if="hasPendingHeroChanges" color="primary" variant="subtle" size="sm">
                  {{ t('admin.about.pendingChanges') }}
                </UBadge>
              </div>

              <div>
                <p class="font-medium">
                  {{ currentHeroName || t('admin.about.noBannerConfigured') }}
                </p>
                <p class="text-muted mt-1 text-sm">
                  {{
                    contentForm.heroImage
                      ? t('admin.about.heroHelpWithImage')
                      : t('admin.about.heroHelpNoImage')
                  }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  variant="outline"
                  icon="i-tabler-upload"
                  :loading="heroUpload.isUploading.value"
                  @click="triggerHeroUpload"
                >
                  {{
                    contentForm.heroImage
                      ? t('admin.about.changeImage')
                      : t('admin.about.uploadImage')
                  }}
                </UButton>

                <UButton
                  v-if="hasPendingHeroChanges"
                  type="button"
                  variant="ghost"
                  color="neutral"
                  icon="i-tabler-x"
                  @click="discardPendingHero"
                >
                  {{ t('admin.about.discardSelection') }}
                </UButton>

                <UButton
                  v-if="contentForm.heroImage || heroUpload.preview"
                  type="button"
                  variant="ghost"
                  color="error"
                  icon="i-tabler-trash"
                  @click="requestClearHero"
                >
                  {{ t('admin.about.removeBanner') }}
                </UButton>
              </div>
              <p v-if="getFieldError('heroImage')" class="text-error text-sm">
                {{ getFieldError('heroImage') }}
              </p>
            </div>

            <div class="rounded-xl border px-4 py-3 lg:min-w-56">
              <p class="text-sm font-medium">{{ t('admin.about.statusLabel') }}</p>
              <p class="text-muted mt-1 text-sm">
                {{
                  contentForm.heroImage
                    ? t('admin.about.statusHelpWithImage')
                    : t('admin.about.statusHelpNoImage')
                }}
              </p>
              <div class="mt-3 flex items-center gap-2">
                <USwitch v-model="contentForm.heroVisible" :disabled="!contentForm.heroImage" />
                <span class="text-sm">{{
                  contentForm.heroVisible ? t('admin.about.visible') : t('admin.about.hidden')
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <input
          :ref="heroUpload.inputRef"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
          class="hidden"
          @change="heroUpload.handleFileSelect"
        />

        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-tabler-device-floppy"
            :loading="isSavingContent"
            :disabled="!hasPendingHeroChanges"
            @click="saveContent"
          >
            {{ t('admin.about.saveChanges') }}
          </UButton>
        </div>

        <p class="text-muted text-sm leading-relaxed">{{ t('admin.about.recommendedRatio') }}</p>
      </div>
    </UCard>

    <UModal v-model:open="showClearHeroModal" :ui="{ content: 'sm:max-w-sm' }">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-base font-bold">{{ t('admin.about.removeBanner') }}</h2>
          </div>
          <p class="text-muted mb-6 text-sm">
            {{ t('admin.about.removeBannerConfirm') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showClearHeroModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" @click="confirmClearHero">{{
              t('admin.about.removeBanner')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
