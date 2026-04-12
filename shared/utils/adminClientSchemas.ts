import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'

type ValidationIssue = {
  message: string
  path: Array<string | number>
}

type ValidationResult<TPayload> =
  | {
      data: TPayload
      success: true
    }
  | {
      error: {
        issues: ValidationIssue[]
      }
      success: false
    }

export interface ClientValidatableSchema<TPayload> {
  safeParse(payload: unknown): ValidationResult<TPayload>
}

const LOWERCASE_SLUG_PATTERN = /^[a-z0-9-]+$/
const DATE_ONLY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const NEWSLETTER_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-01$/

const ok = <TPayload>(data: TPayload): ValidationResult<TPayload> => ({
  data,
  success: true,
})

const fail = <TPayload>(issues: ValidationIssue[]): ValidationResult<TPayload> => ({
  error: { issues },
  success: false,
})

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const asTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const isSupportedLocale = (value: unknown): value is string =>
  typeof value === 'string' &&
  SUPPORTED_LOCALE_CODES.includes(value as (typeof SUPPORTED_LOCALE_CODES)[number])

const isNonNegativeInteger = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

const isSafeHref = (value: string) =>
  (value.startsWith('/') && !value.startsWith('//')) ||
  value.startsWith('#') ||
  value.startsWith('http://') ||
  value.startsWith('https://')

function validateTranslationArray<
  TTranslation extends Record<string, unknown>,
  TField extends keyof TTranslation & string,
>(
  issues: ValidationIssue[],
  translations: unknown,
  requiredField: TField,
  requiredMessage: string,
  validators: (translation: TTranslation, index: number, issues: ValidationIssue[]) => void
) {
  if (!Array.isArray(translations) || translations.length === 0) {
    issues.push({
      message: 'Se requiere al menos una traducción',
      path: ['translations'],
    })
    return
  }

  const locales: string[] = []
  let requiredTranslationIndex = -1

  translations.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      issues.push({
        message: 'Traducción no válida',
        path: ['translations', index],
      })
      return
    }

    const locale = entry.locale
    if (!isSupportedLocale(locale)) {
      issues.push({
        message: 'Invalid locale / El locale no es válido',
        path: ['translations', index, 'locale'],
      })
      return
    }

    locales.push(locale)

    if (locale === DEFAULT_LOCALE_CODE) {
      requiredTranslationIndex = index
    }

    validators(entry as TTranslation, index, issues)
  })

  if (new Set(locales).size !== locales.length) {
    issues.push({
      message: 'No puede haber traducciones duplicadas para el mismo idioma',
      path: ['translations'],
    })
  }

  if (requiredTranslationIndex === -1) {
    issues.push({
      message: requiredMessage,
      path: ['translations'],
    })
    return
  }

  const requiredTranslation = translations[requiredTranslationIndex]
  if (!isPlainObject(requiredTranslation) || !asTrimmedString(requiredTranslation[requiredField])) {
    issues.push({
      message: requiredMessage,
      path: ['translations', requiredTranslationIndex, requiredField],
    })
  }
}

function buildValidator<TPayload>(
  parser: (payload: unknown, issues: ValidationIssue[]) => TPayload | null
): ClientValidatableSchema<TPayload> {
  return {
    safeParse(payload: unknown) {
      const issues: ValidationIssue[] = []
      const parsedPayload = parser(payload, issues)

      if (issues.length > 0 || parsedPayload === null) {
        return fail<TPayload>(issues)
      }

      return ok(parsedPayload)
    },
  }
}

export const createTagClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const slug = asTrimmedString(payload.slug)
  if (!slug) {
    issues.push({ message: 'El slug es requerido', path: ['slug'] })
  } else if (slug.length > 100) {
    issues.push({ message: 'El slug es requerido', path: ['slug'] })
  } else if (!LOWERCASE_SLUG_PATTERN.test(slug)) {
    issues.push({
      message: 'El slug solo puede contener letras minúsculas, números y guiones',
      path: ['slug'],
    })
  } else if (slug === 'all') {
    issues.push({ message: "El slug 'all' está reservado", path: ['slug'] })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  validateTranslationArray<{ locale: string; name?: string }, 'name'>(
    issues,
    payload.translations,
    'name',
    'El nombre en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.name).length > 100) {
        nextIssues.push({
          message: 'El nombre en español es obligatorio',
          path: ['translations', index, 'name'],
        })
      }
    }
  )

  return payload as TTagPayload
})

type TTagPayload = {
  order: number
  slug: string
  translations: Array<{ locale: string; name: string }>
}

export const updatePressDossierClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const pdfUrl = payload.pdfUrl
  const active = payload.active

  if (pdfUrl !== null && (typeof pdfUrl !== 'string' || pdfUrl.length === 0)) {
    issues.push({ message: 'El PDF es requerido', path: ['pdfUrl'] })
  }

  if (typeof active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  if (active === true && !pdfUrl) {
    issues.push({
      message: 'Debes subir un PDF para activar el dossier',
      path: ['pdfUrl'],
    })
  }

  return payload as { active: boolean; pdfUrl: string | null }
})

export const createMediaOutletClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const name = asTrimmedString(payload.name)
  const website = asTrimmedString(payload.website)
  const logo = asTrimmedString(payload.logo)

  if (!name) {
    issues.push({ message: 'El nombre es requerido', path: ['name'] })
  } else if (name.length > 200) {
    issues.push({ message: 'El nombre es requerido', path: ['name'] })
  }

  if (!website) {
    issues.push({ message: 'La URL no es válida', path: ['website'] })
  } else {
    try {
      const url = new URL(website)
      if (!['http:', 'https:'].includes(url.protocol) || website.length > 2048) {
        issues.push({ message: 'La URL no es válida', path: ['website'] })
      }
    } catch {
      issues.push({ message: 'La URL no es válida', path: ['website'] })
    }
  }

  if (!logo) {
    issues.push({ message: 'El logo es requerido', path: ['logo'] })
  } else if (logo.length > 2048) {
    issues.push({ message: 'El logo es requerido', path: ['logo'] })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  return payload as { logo: string; name: string; order: number; website: string }
})

export const createCarouselItemClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const image = asTrimmedString(payload.image)
  const href = asTrimmedString(payload.href)

  if (!image) {
    issues.push({ message: 'La imagen es requerida', path: ['image'] })
  } else if (image.length > 2048) {
    issues.push({ message: 'La imagen es requerida', path: ['image'] })
  }

  if (!href || !isSafeHref(href)) {
    issues.push({
      message: 'El enlace debe ser una ruta relativa o una URL http/https',
      path: ['href'],
    })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  if (typeof payload.active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  validateTranslationArray<
    { alt?: string; buttonText?: string; locale: string; title?: string },
    'title'
  >(
    issues,
    payload.translations,
    'title',
    'El título en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.title).length > 200) {
        nextIssues.push({
          message: 'El título en español es obligatorio',
          path: ['translations', index, 'title'],
        })
      }

      if (asTrimmedString(translation.buttonText).length > 100) {
        nextIssues.push({
          message: 'Texto del botón no válido',
          path: ['translations', index, 'buttonText'],
        })
      }

      if (asTrimmedString(translation.alt).length > 200) {
        nextIssues.push({
          message: 'Texto alternativo no válido',
          path: ['translations', index, 'alt'],
        })
      }
    }
  )

  return payload as {
    active: boolean
    href: string
    image: string
    order: number
    translations: Array<{ alt?: string; buttonText?: string; locale: string; title: string }>
  }
})

export const createFeaturedLinkClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const image = asTrimmedString(payload.image)
  const to = asTrimmedString(payload.to)

  if (!image) {
    issues.push({ message: 'La imagen es requerida', path: ['image'] })
  } else if (image.length > 2048) {
    issues.push({ message: 'La imagen es requerida', path: ['image'] })
  }

  if (!to || !isSafeHref(to)) {
    issues.push({
      message: 'El enlace debe ser una ruta relativa o una URL http/https',
      path: ['to'],
    })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  if (typeof payload.active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  validateTranslationArray<{ alt?: string; locale: string; title?: string }, 'title'>(
    issues,
    payload.translations,
    'title',
    'El título en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.title).length > 200) {
        nextIssues.push({
          message: 'El título en español es obligatorio',
          path: ['translations', index, 'title'],
        })
      }

      if (asTrimmedString(translation.alt).length > 200) {
        nextIssues.push({
          message: 'Texto alternativo no válido',
          path: ['translations', index, 'alt'],
        })
      }
    }
  )

  return payload as {
    active: boolean
    image: string
    order: number
    to: string
    translations: Array<{ alt?: string; locale: string; title: string }>
  }
})

export const createEqualityDocumentClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const pdfUrl = asTrimmedString(payload.pdfUrl)
  if (!pdfUrl) {
    issues.push({ message: 'El PDF es requerido', path: ['pdfUrl'] })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  if (typeof payload.active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  validateTranslationArray<
    { description?: string; locale: string; meta?: string | null; title?: string },
    'title'
  >(
    issues,
    payload.translations,
    'title',
    'El título en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.title).length > 200) {
        nextIssues.push({
          message: 'El título en español es obligatorio',
          path: ['translations', index, 'title'],
        })
      }

      if (!asTrimmedString(translation.description)) {
        return
      }

      if (asTrimmedString(translation.description).length > 2000) {
        nextIssues.push({
          message: 'La descripción en español es obligatoria',
          path: ['translations', index, 'description'],
        })
      }

      if (asTrimmedString(translation.meta).length > 500) {
        nextIssues.push({
          message: 'Meta no válida',
          path: ['translations', index, 'meta'],
        })
      }
    }
  )

  const translations = Array.isArray(payload.translations) ? payload.translations : []
  const requiredIndex = translations.findIndex(
    (translation) => isPlainObject(translation) && translation.locale === DEFAULT_LOCALE_CODE
  )

  if (requiredIndex >= 0) {
    const requiredTranslation = translations[requiredIndex] as Record<string, unknown>
    if (!asTrimmedString(requiredTranslation.description)) {
      issues.push({
        message: 'La descripción en español es obligatoria',
        path: ['translations', requiredIndex, 'description'],
      })
    }
  }

  return payload as {
    active: boolean
    order: number
    pdfUrl: string
    translations: Array<{
      description: string
      locale: string
      meta?: string | null
      title: string
    }>
  }
})

export const createFinancialReportClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const pdfUrl = asTrimmedString(payload.pdfUrl)
  const approvedAt = asTrimmedString(payload.approvedAt)

  if (!pdfUrl) {
    issues.push({ message: 'El PDF es requerido', path: ['pdfUrl'] })
  }

  if (!DATE_ONLY_PATTERN.test(approvedAt)) {
    issues.push({ message: 'La fecha no es válida', path: ['approvedAt'] })
  }

  if (!isNonNegativeInteger(payload.order)) {
    issues.push({ message: 'Orden no válido', path: ['order'] })
  }

  if (typeof payload.active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  validateTranslationArray<{ locale: string; title?: string }, 'title'>(
    issues,
    payload.translations,
    'title',
    'El título en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.title).length > 200) {
        nextIssues.push({
          message: 'El título en español es obligatorio',
          path: ['translations', index, 'title'],
        })
      }
    }
  )

  return payload as {
    active: boolean
    approvedAt: string
    order: number
    pdfUrl: string
    translations: Array<{ locale: string; title: string }>
  }
})

export const createNewsletterRequestClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const month = asTrimmedString(payload.month)
  const coverImage = asTrimmedString(payload.coverImage)
  const pdfUrl = asTrimmedString(payload.pdfUrl)
  const active = payload.active
  const publicVisible = payload.publicVisible
  const sendEmail = payload.sendEmail

  if (!NEWSLETTER_MONTH_PATTERN.test(month)) {
    issues.push({ message: 'El mes no es válido', path: ['month'] })
  }

  if (!coverImage || coverImage.length > 2048) {
    issues.push({ message: 'La imagen de portada es requerida', path: ['coverImage'] })
  }

  if (!pdfUrl || pdfUrl.length > 2048) {
    issues.push({ message: 'El PDF es requerido', path: ['pdfUrl'] })
  }

  if (typeof active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  if (typeof publicVisible !== 'boolean') {
    issues.push({ message: 'Visibilidad no válida', path: ['publicVisible'] })
  }

  if (typeof sendEmail !== 'boolean') {
    issues.push({ message: 'Envío no válido', path: ['sendEmail'] })
  }

  if (sendEmail === true && active !== true) {
    issues.push({
      message: 'Debes habilitar el envío para enviar la newsletter ahora',
      path: ['active'],
    })
  }

  return payload as {
    active: boolean
    coverImage: string
    month: string
    pdfUrl: string
    publicVisible: boolean
    sendEmail: boolean
  }
})
