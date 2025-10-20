import type { H3Event } from 'h3'

export function getDefaultLocale(): string {
  const {
    public: {
      i18n: { defaultLocale },
    },
  } = useRuntimeConfig()
  return defaultLocale
}

export function getLocale(event: H3Event): string {
  return event.context.i18n?.locale || getDefaultLocale()
}
