const STORAGE_KEY = 'cookie-information-banner-dismissed'

export function useCookieConsent() {
  const dismissed = useState('cookie-information-banner-dismissed', () => false)
  const isReady = useState('cookie-information-banner-ready', () => false)
  const showBanner = computed(() => isReady.value && !dismissed.value)

  if (import.meta.client) {
    onMounted(() => {
      dismissed.value = window.sessionStorage.getItem(STORAGE_KEY) === '1'
      isReady.value = true
    })
  }

  function dismissBanner() {
    dismissed.value = true

    if (import.meta.client) {
      window.sessionStorage.setItem(STORAGE_KEY, '1')
    }
  }

  return {
    showBanner,
    dismissBanner,
  }
}
