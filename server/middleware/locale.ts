import { defineEventHandler, getCookie } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  const cookie = getCookie(event, config.public.i18n.detectBrowserLanguage.cookieKey)

  let resolved = config.public.i18n.defaultLocale

  if (cookie) {
    const locales = config.public.i18n.locales as Array<{ code: string }>
    const codes = locales.map((l) => String(l.code).toLowerCase())
    const matched = codes.find((code) => cookie.startsWith(code))
    if (matched) resolved = matched
  }

  // Attach to request context for downstream handlers with a safe custom key
  const ctx = event.context as unknown as { requestLocale: string }
  ctx.requestLocale = resolved
})
