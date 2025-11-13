import { defineEventHandler } from 'h3'

type Localized = Record<string, string>

const TAGS: Localized[] = [
  { es: 'Todas', en: 'All' },
  { es: 'Calidad', en: 'Quality' },
  { es: 'Prácticas', en: 'Internships' },
  { es: 'Vida Universitaria', en: 'University Life' },
  { es: 'Política Universitaria', en: 'University Politics' },
]

export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale
  const pick = (obj: Localized): string => obj?.[locale] ?? Object.values(obj)[0] ?? ''

  const payload = {
    tags: TAGS.map(pick),
  }

  return payload
})
