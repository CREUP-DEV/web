import { defineEventHandler } from 'h3'

type Localized = Record<string, string>

const TAGS: Localized[] = [
  { es: 'Todas', en: 'All' },
  { es: 'Política Universitaria', en: 'University Policy' },
  { es: 'Soberanía Digital', en: 'Digital Sovereignty' },
  { es: 'Financiación y Becas', en: 'Funding & Scholarships' },
  { es: 'Derechos y Convivencia', en: 'Rights & Coexistence' },
  { es: 'Calidad Docente', en: 'Teaching Quality' },
  { es: 'Vida Universitaria y Salud', en: 'University Life & Health' },
  { es: 'Inclusión e Igualdad', en: 'Inclusion & Equality' },
  { es: 'Internacional', en: 'International' },
]

export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale
  const pick = (obj: Localized): string => obj?.[locale] ?? Object.values(obj)[0] ?? ''

  const payload = {
    tags: TAGS.map(pick),
  }

  return payload
})
