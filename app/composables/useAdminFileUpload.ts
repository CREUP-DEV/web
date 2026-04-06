interface UseAdminFileUploadOptions {
  endpoint: string
  errorMessage: string
  extraFields?: Record<string, string>
  getFallbackPreview?: () => string | null
  onUploaded: (storagePath: string) => void
  successMessage: string
}

interface UploadedAdminFileResponse {
  storagePath: string
}

export function useAdminFileUpload(options: UseAdminFileUploadOptions) {
  const toast = useToast()
  const inputRef = ref<HTMLInputElement | null>(null)
  const preview = ref<string | null>(null)
  const isUploading = ref(false)

  const triggerFileDialog = () => {
    inputRef.value?.click()
  }

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
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
      })

      options.onUploaded(result.storagePath)
      preview.value = result.storagePath

      toast.add({
        title: options.successMessage,
        color: 'success',
      })
    } catch (error) {
      console.error('Error uploading admin file:', error)
      preview.value = options.getFallbackPreview?.() ?? null

      toast.add({
        title: options.errorMessage,
        color: 'error',
      })
    } finally {
      isUploading.value = false
      target.value = ''
    }
  }

  return {
    handleFileSelect,
    inputRef,
    isUploading,
    preview,
    triggerFileDialog,
  }
}
