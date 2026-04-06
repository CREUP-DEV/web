export function useCopyToClipboard() {
  const toast = useToast()

  const copyToClipboard = async (text: string, successTitle: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.add({
        title: successTitle,
        color: 'success',
      })
    } catch {
      // Silently ignore clipboard errors (e.g. permission denied)
    }
  }

  return { copyToClipboard }
}
