import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'

interface UseAdminFileUploadOptions {
  endpoint: string
  errorMessage: string
  extraFields?: Record<string, string>
  getFallbackPreview?: () => string | null
  maxFileSizeBytes?: number
  maxFileSizeMessage?: string
  onUploaded: (storagePath: string) => void
  successMessage: string
}

interface UploadedAdminFileResponse {
  storagePath: string
}

function getUploadErrorMessage(error: unknown, fallback: string, requestTooLargeMessage: string) {
  const message = getApiErrorMessage(error, fallback)

  if (
    getApiErrorStatusCode(error) === 413 &&
    (message === fallback || /payload|entity|large/i.test(message))
  ) {
    return requestTooLargeMessage
  }

  return message
}

export function useAdminFileUpload(options: UseAdminFileUploadOptions) {
  const { t } = useI18n()
  const toast = useAdminToast()
  const inputRef = ref<HTMLInputElement | null>(null)
  const preview = ref<string | null>(null)
  const isUploading = ref(false)
  const activeUploadId = ref<symbol | null>(null)
  const activeUploadController = ref<AbortController | null>(null)
  const isUnmounted = ref(false)

  onUnmounted(() => {
    isUnmounted.value = true
    activeUploadController.value?.abort()
    activeUploadController.value = null
    activeUploadId.value = null
  })

  const triggerFileDialog = () => {
    inputRef.value?.click()
  }

  /** Set the preview externally (e.g. when populating a form from an existing record). */
  const setPreview = (url: string | null) => {
    preview.value = url
  }

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      return
    }

    const uploadId = Symbol('admin-upload')
    activeUploadId.value = uploadId

    activeUploadController.value?.abort()
    const uploadController = new AbortController()
    activeUploadController.value = uploadController

    let uploadSucceeded = false

    if (options.maxFileSizeBytes && file.size > options.maxFileSizeBytes) {
      preview.value = options.getFallbackPreview?.() ?? null
      activeUploadController.value = null
      activeUploadId.value = null
      target.value = ''
      toast.add({
        title:
          options.maxFileSizeMessage ??
          t('admin.common.fileTooLargeMb', {
            mb: Math.round(options.maxFileSizeBytes / 1024 / 1024),
          }),
        color: 'error',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (uploadSucceeded || isUnmounted.value || activeUploadId.value !== uploadId) {
        return
      }

      preview.value = loadEvent.target?.result as string
    }
    reader.readAsDataURL(file)

    isUploading.value = true

    try {
      const formData = new FormData()
      formData.append('file', file)

      for (const [field, value] of Object.entries(options.extraFields ?? {})) {
        formData.append(field, value)
      }

      const result = await $fetch<UploadedAdminFileResponse>(options.endpoint, {
        method: 'POST',
        body: formData,
        signal: uploadController.signal,
      })

      uploadSucceeded = true

      if (isUnmounted.value || activeUploadId.value !== uploadId) {
        return
      }

      options.onUploaded(result.storagePath)
      preview.value = result.storagePath

      toast.add({
        title: options.successMessage,
        color: 'success',
      })
    } catch (error) {
      const isAbortError =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : Boolean(
              error &&
              typeof error === 'object' &&
              'name' in error &&
              (error as { name?: string }).name === 'AbortError'
            )

      if (isAbortError && (isUnmounted.value || activeUploadId.value !== uploadId)) {
        return
      }

      if (isUnmounted.value || activeUploadId.value !== uploadId) {
        return
      }

      preview.value = options.getFallbackPreview?.() ?? null

      toast.add({
        title: getUploadErrorMessage(
          error,
          options.errorMessage,
          t('admin.common.uploadRequestTooLarge')
        ),
        color: 'error',
      })
    } finally {
      if (activeUploadController.value === uploadController) {
        activeUploadController.value = null
      }

      if (activeUploadId.value === uploadId) {
        activeUploadId.value = null

        if (!isUnmounted.value) {
          isUploading.value = false
          target.value = ''
        }
      }
    }
  }

  return {
    handleFileSelect,
    inputRef,
    isUploading,
    preview,
    setPreview,
    triggerFileDialog,
  }
}

interface UseAdminDocumentUploadOptions {
  endpoint: string
  successMessage?: string
  errorMessage?: string
  maxFileSizeBytes?: number
  maxFileSizeMessage?: string
  onUploaded: (storagePath: string) => void
}

/** Manages PDF/document upload state: filename display and uploading flag. */
export function useAdminDocumentUpload(options: UseAdminDocumentUploadOptions) {
  const { t } = useI18n()
  const toast = useAdminToast()
  const inputRef = ref<HTMLInputElement | null>(null)
  const fileName = ref<string | null>(null)
  const isUploading = ref(false)
  const activeUploadId = ref<symbol | null>(null)
  const activeUploadController = ref<AbortController | null>(null)
  const isUnmounted = ref(false)

  onUnmounted(() => {
    isUnmounted.value = true
    activeUploadController.value?.abort()
    activeUploadController.value = null
    activeUploadId.value = null
  })

  const triggerFileDialog = () => {
    inputRef.value?.click()
  }

  /** Set state from an existing document path (e.g. when populating a form from a record). */
  const setFile = (path: string | null) => {
    fileName.value = path ? (path.split('/').pop() ?? null) : null
  }

  const remove = () => {
    fileName.value = null
    if (inputRef.value) inputRef.value.value = ''
  }

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const uploadId = Symbol('admin-document-upload')
    activeUploadId.value = uploadId

    activeUploadController.value?.abort()
    const uploadController = new AbortController()
    activeUploadController.value = uploadController

    fileName.value = file.name

    if (options.maxFileSizeBytes && file.size > options.maxFileSizeBytes) {
      fileName.value = null
      activeUploadController.value = null
      activeUploadId.value = null
      target.value = ''
      toast.add({
        title:
          options.maxFileSizeMessage ??
          t('admin.common.fileTooLargeMb', {
            mb: Math.round(options.maxFileSizeBytes / 1024 / 1024),
          }),
        color: 'error',
      })
      return
    }

    isUploading.value = true

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await $fetch<UploadedAdminFileResponse>(options.endpoint, {
        method: 'POST',
        body: formData,
        signal: uploadController.signal,
      })

      if (isUnmounted.value || activeUploadId.value !== uploadId) {
        return
      }

      options.onUploaded(result.storagePath)
      toast.add({
        title: options.successMessage ?? t('admin.common.fileUploaded'),
        color: 'success',
      })
    } catch (error) {
      const isAbortError =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : Boolean(
              error &&
              typeof error === 'object' &&
              'name' in error &&
              (error as { name?: string }).name === 'AbortError'
            )

      if (isAbortError && (isUnmounted.value || activeUploadId.value !== uploadId)) {
        return
      }

      if (isUnmounted.value || activeUploadId.value !== uploadId) {
        return
      }

      fileName.value = null
      toast.add({
        title: getUploadErrorMessage(
          error,
          options.errorMessage ?? t('admin.common.fileUploadFailed'),
          t('admin.common.uploadRequestTooLarge')
        ),
        color: 'error',
      })
    } finally {
      if (activeUploadController.value === uploadController) {
        activeUploadController.value = null
      }

      if (activeUploadId.value === uploadId) {
        activeUploadId.value = null

        if (!isUnmounted.value) {
          isUploading.value = false
          target.value = ''
        }
      }
    }
  }

  return { handleFileSelect, inputRef, isUploading, fileName, triggerFileDialog, setFile, remove }
}
