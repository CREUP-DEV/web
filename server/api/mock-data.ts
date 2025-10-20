import { defineEventHandler, getQuery } from 'h3'
import mockData from '../../data/mock.json'

const DEFAULT_LOCALE = 'es'

function normalizeLocaleParam(param: unknown) {
  if (Array.isArray(param)) {
    const [first] = param
    return typeof first === 'string' ? first : undefined
  }

  return typeof param === 'string' ? param : undefined
}

function pickLocalizedField(field: Record<string, string>, requestedLocale: string) {
  if (field[requestedLocale]) {
    return { value: field[requestedLocale], resolvedLocale: requestedLocale }
  }

  if (field[DEFAULT_LOCALE]) {
    return { value: field[DEFAULT_LOCALE], resolvedLocale: DEFAULT_LOCALE }
  }

  const [firstLocale, firstValue] = Object.entries(field)[0] ?? ['', '']
  return { value: firstValue, resolvedLocale: firstLocale }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawLocale = normalizeLocaleParam(query.locale)
  const requestedLocale = rawLocale && typeof rawLocale === 'string' ? rawLocale : DEFAULT_LOCALE

  const locales = new Set<string>()
  let fallbackUsed = false

  const payload = {
    carousel: mockData.carousel.map((item) => {
      Object.keys(item.title).forEach((key) => locales.add(key))
      Object.keys(item.buttonText).forEach((key) => locales.add(key))

      const title = pickLocalizedField(item.title, requestedLocale)
      const buttonText = pickLocalizedField(item.buttonText, requestedLocale)

      if (
        title.resolvedLocale !== requestedLocale ||
        buttonText.resolvedLocale !== requestedLocale
      ) {
        fallbackUsed = true
      }

      return {
        image: item.image,
        href: item.href,
        title: title.value,
        buttonText: buttonText.value,
      }
    }),
    meta: {
      requestedLocale,
      resolvedLocale: fallbackUsed ? DEFAULT_LOCALE : requestedLocale,
      fallbackApplied: fallbackUsed,
      availableLocales: Array.from(locales.values()),
    },
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(payload)
    }, 1000) // Simulate a 1-second delay
  })
})
