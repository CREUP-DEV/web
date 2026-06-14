export const DEFAULT_LOCALE_CODE = 'es'

export interface LocaleDefinitionConfig {
  code: string
  language: string
  file: string
  name: string
  flag: string
}

/**
 * Single source of truth for supported-locale metadata. Everything derives from this:
 * nuxt.config's `i18n.locales`, `SUPPORTED_LOCALE_CODES`, the runtime locale utilities
 * (`shared/utils/locale.ts`), and the i18n parity script's file list. To add a locale,
 * add an entry here plus its `i18n/locales/<file>` and the rest follows.
 */
export const LOCALE_DEFINITIONS = [
  { code: 'es', language: 'es-ES', file: 'es.json', name: 'Español', flag: 'i-circle-flags-es' },
  { code: 'en', language: 'en-GB', file: 'en.json', name: 'English', flag: 'i-circle-flags-gb' },
  { code: 'ca', language: 'ca-ES', file: 'ca.json', name: 'Català', flag: 'i-circle-flags-es-ct' },
  { code: 'eu', language: 'eu-ES', file: 'eu.json', name: 'Euskara', flag: 'i-circle-flags-es-pv' },
  { code: 'gl', language: 'gl-ES', file: 'gl.json', name: 'Galego', flag: 'i-circle-flags-es-ga' },
  // Valencian: a Catalan variant with no 2-letter ISO code. `code: 'val'` keeps a clean
  // `/val/` URL prefix and a unique base; `language` carries the BCP-47 hreflang tag. Iconify
  // has no Valencian flag, so it uses the local `flags` custom collection (app/assets/flags).
  {
    code: 'val',
    language: 'ca-ES-valencia',
    file: 'val.json',
    name: 'Valencià',
    flag: 'i-flags-val',
  },
] as const satisfies readonly LocaleDefinitionConfig[]

export type SupportedLocaleCode = (typeof LOCALE_DEFINITIONS)[number]['code']

export const SUPPORTED_LOCALE_CODES: SupportedLocaleCode[] = LOCALE_DEFINITIONS.map(
  (locale) => locale.code
)
