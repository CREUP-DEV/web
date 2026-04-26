interface TurnstileApi {
  render(container: string | HTMLElement, options: Record<string, unknown>): string
  reset(widgetId?: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    __creupTurnstileScriptPromise?: Promise<void>
    turnstile?: TurnstileApi
  }
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstileScript() {
  if (!import.meta.client) {
    return Promise.resolve()
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (window.__creupTurnstileScriptPromise) {
    return window.__creupTurnstileScriptPromise
  }

  window.__creupTurnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load Turnstile.')),
        {
          once: true,
        }
      )
      return
    }

    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Failed to load Turnstile.')), {
      once: true,
    })
    document.head.appendChild(script)
  })

  return window.__creupTurnstileScriptPromise
}

interface UseTurnstileOptions {
  containerId: string
  enabled: MaybeRefOrGetter<boolean>
  siteKey: MaybeRefOrGetter<string | undefined>
}

export function useTurnstile(options: UseTurnstileOptions) {
  const token = ref('')
  const hasError = ref(false)
  const isReady = ref(false)
  const widgetId = ref<string | null>(null)

  const enabled = computed(() => toValue(options.enabled))
  const siteKey = computed(() => toValue(options.siteKey)?.trim() || '')

  const clearState = () => {
    token.value = ''
    hasError.value = false
  }

  const removeWidget = () => {
    if (!import.meta.client || !widgetId.value || !window.turnstile) {
      return
    }

    window.turnstile.remove(widgetId.value)
    widgetId.value = null
  }

  const renderWidget = async () => {
    if (!import.meta.client) {
      return
    }

    clearState()
    isReady.value = false

    if (!enabled.value) {
      removeWidget()
      return
    }

    if (!siteKey.value) {
      hasError.value = true
      return
    }

    try {
      await loadTurnstileScript()
    } catch {
      hasError.value = true
      return
    }

    if (!window.turnstile) {
      hasError.value = true
      return
    }

    const container = document.getElementById(options.containerId)
    if (!container) {
      hasError.value = true
      return
    }

    removeWidget()

    widgetId.value = window.turnstile.render(`#${options.containerId}`, {
      sitekey: siteKey.value,
      callback(nextToken: string) {
        token.value = String(nextToken || '').trim()
        hasError.value = false
      },
      'error-callback': () => {
        token.value = ''
        hasError.value = true
      },
      'expired-callback': () => {
        token.value = ''
      },
    })

    isReady.value = true
  }

  function reset() {
    clearState()

    if (!import.meta.client || !widgetId.value || !window.turnstile) {
      return
    }

    window.turnstile.reset(widgetId.value)
  }

  onMounted(() => {
    void nextTick(() => renderWidget())
  })

  watch(
    [enabled, siteKey],
    () => {
      void nextTick(() => renderWidget())
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    removeWidget()
  })

  return {
    hasError,
    isReady,
    reset,
    token,
  }
}
