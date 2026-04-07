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
    setPreview,
    triggerFileDialog,
  }
}

interface UseAdminDocumentUploadOptions {
  endpoint: string
  onUploaded: (storagePath: string) => void
}

/** Manages PDF/document upload state: filename display and uploading flag. */
export function useAdminDocumentUpload(options: UseAdminDocumentUploadOptions) {
  const toast = useToast()
  const inputRef = ref<HTMLInputElement | null>(null)
  const fileName = ref<string | null>(null)
  const isUploading = ref(false)

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

    fileName.value = file.name
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await $fetch<UploadedAdminFileResponse>(options.endpoint, {
        method: 'POST',
        body: formData,
      })
      options.onUploaded(result.storagePath)
      toast.add({ title: 'PDF subido correctamente', color: 'success' })
    } catch (error) {
      console.error('Error uploading admin document:', error)
      fileName.value = null
      toast.add({ title: 'No se pudo subir el PDF', color: 'error' })
    } finally {
      isUploading.value = false
      target.value = ''
    }
  }

  return { handleFileSelect, inputRef, isUploading, fileName, triggerFileDialog, setFile, remove }
}
