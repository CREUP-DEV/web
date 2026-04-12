import { isLocalDevelopmentHostname } from '~~/shared/utils/url'

export function useTurnstileAvailability() {
  const runtimeConfig = useRuntimeConfig()
  const requestUrl = useRequestURL()

  const turnstileSiteKey = computed(() =>
    ((runtimeConfig.public?.turnstileSiteKey as string | undefined) ?? '').trim()
  )
  const isLocalDevelopment = computed(
    () => import.meta.dev && isLocalDevelopmentHostname(requestUrl.hostname)
  )
  const turnstileEnabled = computed(
    () => turnstileSiteKey.value.length > 0 && !isLocalDevelopment.value
  )

  return {
    isLocalDevelopment,
    turnstileEnabled,
    turnstileSiteKey,
  }
}
