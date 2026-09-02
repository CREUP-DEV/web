import { pickLocalizedValue } from '~~/shared/utils/locale'

/**
 * Fixed labels of the campaign email. They live here, not in `i18n/locales/*.json`: those files
 * ship to the browser bundle and describe the interface, while these are rendered server-side once
 * per locale at send time. Same shape as `apiErrorMessages.ts` — one object per locale, resolved
 * through `pickLocalizedValue` with a Spanish fallback.
 */

const es = {
  readMore: 'Leer más',
  receptionReason: 'Recibes este correo porque estás suscrito/a a la newsletter de CREUP.',
  sectionActivity: 'Nuestra actividad más reciente',
  sectionAreaReport: 'Conoce el trabajo de nuestras áreas',
  sectionPress: 'Últimas noticias',
  unsubscribe: 'Darme de baja',
} as const

export type NewsletterEmailMessageKey = keyof typeof es

export type NewsletterEmailMessages = Record<NewsletterEmailMessageKey, string>

const en: NewsletterEmailMessages = {
  readMore: 'Read more',
  receptionReason:
    'You are receiving this email because you are subscribed to the CREUP newsletter.',
  sectionActivity: 'Our latest activity',
  sectionAreaReport: 'Inside our areas',
  sectionPress: 'Latest news',
  unsubscribe: 'Unsubscribe',
}

const ca: NewsletterEmailMessages = {
  readMore: 'Llegeix-ne més',
  receptionReason: 'Reps aquest correu perquè estàs subscrit/a a la newsletter de la CREUP.',
  sectionActivity: 'La nostra activitat més recent',
  sectionAreaReport: 'Coneix la feina de les nostres àrees',
  sectionPress: 'Últimes notícies',
  unsubscribe: 'Donar-me de baixa',
}

const eu: NewsletterEmailMessages = {
  readMore: 'Irakurri gehiago',
  receptionReason: 'Mezu hau jasotzen duzu CREUPen newsletter-era harpidetuta zaudelako.',
  sectionActivity: 'Gure azken jarduera',
  sectionAreaReport: 'Ezagutu gure arloen lana',
  sectionPress: 'Azken albisteak',
  unsubscribe: 'Baja eman',
}

const gl: NewsletterEmailMessages = {
  readMore: 'Ler máis',
  receptionReason: 'Recibes este correo porque estás subscrito/a á newsletter de CREUP.',
  sectionActivity: 'A nosa actividade máis recente',
  sectionAreaReport: 'Coñece o traballo das nosas áreas',
  sectionPress: 'Últimas novas',
  unsubscribe: 'Darme de baixa',
}

const val: NewsletterEmailMessages = {
  readMore: 'Llig-ne més',
  receptionReason: 'Reps este correu perquè estàs subscrit/a a la newsletter de la CREUP.',
  sectionActivity: 'La nostra activitat més recent',
  sectionAreaReport: 'Coneix la faena de les nostres àrees',
  sectionPress: 'Últimes notícies',
  unsubscribe: 'Donar-me de baixa',
}

const newsletterEmailMessagesByLocale = { es, en, ca, eu, gl, val }

/**
 * Resolves the whole label set once per render. Takes the internal locale **code** (`val`), never
 * a BCP 47 tag: `pickLocalizedValue` also probes the base language, so `ca-ES-valencia` would
 * silently resolve to Catalan.
 */
export const getNewsletterEmailMessages = (
  localeCode: string | null | undefined
): NewsletterEmailMessages =>
  pickLocalizedValue(newsletterEmailMessagesByLocale, localeCode, null) ??
  newsletterEmailMessagesByLocale.es
