export function useCopyToClipboard() {
  const toast = useToast()
  const { t } = useI18n()

  const copyToClipboard = async (text: string, successTitle: string, errorTitle?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({
        title: successTitle,
        color: 'success',
      })
    } catch {
      toast.add({
        title: errorTitle ?? t('press.copy.error'),
        color: 'error',
      })
    }
  }

  return { copyToClipboard }
}
