import { isLocalDevelopmentHostname } from '~~/shared/utils/url'

export function useTurnstileAvailability() {
  const runtimeConfig = useRuntimeConfig()
  const requestUrl = useRequestURL()

  const turnstileSiteKey = computed(() =>
    ((runtimeConfig.public?.turnstileSiteKey as string | undefined) ?? '').trim()
  )
  // Turnstile doesn't work on local hostnames regardless of build mode
  // (Cloudflare rejects domains not registered in the site key's allowed list).
  const isLocalDevelopment = computed(() => isLocalDevelopmentHostname(requestUrl.hostname))
  const turnstileEnabled = computed(
    () => turnstileSiteKey.value.length > 0 && !isLocalDevelopment.value
  )

  return {
    isLocalDevelopment,
    turnstileEnabled,
    turnstileSiteKey,
  }
}
