// Client-side validator for the press article admin form. Kept hand-written (not zod) because the
// server press schema (server/utils/validation/press.ts) validates rich text via a server-only
// sanitization helper that cannot run in the client bundle, so it can't be single-sourced here.
// Emits the same issue-path shape as zod's safeParse so it plugs into useFormValidation.
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'
import { ADMIN_RICH_TEXT_MAX_HTML_LENGTH, hasMeaningfulHtml } from '~~/shared/utils/richText'

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

const DATE_ONLY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const PRESS_ARTICLE_TYPE_SET = new Set<string>(PRESS_ARTICLE_TYPES)

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

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

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

export const pressArticleClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const type = asTrimmedString(payload.type)
  const image = payload.image
  const pdfUrl = payload.pdfUrl
  const externalUrl = payload.externalUrl
  const mediaOutletId = payload.mediaOutletId
  const active = payload.active
  const publishedAt = payload.publishedAt
  const tagIds = payload.tagIds

  if (!PRESS_ARTICLE_TYPE_SET.has(type)) {
    issues.push({ message: 'Tipo de artículo no válido', path: ['type'] })
  }

  if (image !== null && image !== undefined) {
    if (typeof image !== 'string') {
      issues.push({ message: 'La imagen de portada no es válida', path: ['image'] })
    } else if (image.trim() === '') {
      // omit — treated as no custom cover
    } else if (image.length > 2048) {
      issues.push({ message: 'La imagen no es válida', path: ['image'] })
    } else if (image.startsWith('http://') || image.startsWith('https://')) {
      issues.push({
        message: 'La imagen debe ser una ruta interna, no una URL externa',
        path: ['image'],
      })
    }
  }

  if (pdfUrl !== null && pdfUrl !== undefined && (typeof pdfUrl !== 'string' || !pdfUrl.trim())) {
    issues.push({ message: 'El PDF no es válido', path: ['pdfUrl'] })
  }

  if (externalUrl !== null && externalUrl !== undefined) {
    if (typeof externalUrl !== 'string' || !externalUrl.trim() || !isValidUrl(externalUrl)) {
      issues.push({ message: 'La URL externa no es válida', path: ['externalUrl'] })
    }
  }

  if (mediaOutletId !== null && mediaOutletId !== undefined) {
    if (typeof mediaOutletId !== 'string' || !mediaOutletId.trim()) {
      issues.push({ message: 'El medio no es válido', path: ['mediaOutletId'] })
    }
  }

  if (typeof active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  if (publishedAt !== undefined && publishedAt !== null) {
    if (typeof publishedAt !== 'string' || !DATE_ONLY_PATTERN.test(publishedAt)) {
      issues.push({ message: 'La fecha de publicación no es válida', path: ['publishedAt'] })
    }
  }

  if (!Array.isArray(tagIds)) {
    issues.push({ message: 'Las etiquetas no son válidas', path: ['tagIds'] })
  } else if (tagIds.some((tagId) => typeof tagId !== 'string' || !tagId.trim())) {
    issues.push({ message: 'Las etiquetas no son válidas', path: ['tagIds'] })
  }

  validateTranslationArray<
    {
      locale: string
      title?: string
      description?: string
      contentHtml?: string | null
      alt?: string
    },
    'title'
  >(
    issues,
    payload.translations,
    'title',
    'El título en español es obligatorio',
    (translation, index, nextIssues) => {
      if (asTrimmedString(translation.title).length > 200) {
        nextIssues.push({
          message: 'El título no puede superar los 200 caracteres',
          path: ['translations', index, 'title'],
        })
      }

      if (asTrimmedString(translation.description).length > 2000) {
        nextIssues.push({
          message: 'La descripción no puede superar los 2000 caracteres',
          path: ['translations', index, 'description'],
        })
      }

      if (translation.contentHtml != null) {
        if (typeof translation.contentHtml !== 'string') {
          nextIssues.push({
            message: 'El contenido no es válido',
            path: ['translations', index, 'contentHtml'],
          })
        } else if (translation.contentHtml.length > ADMIN_RICH_TEXT_MAX_HTML_LENGTH) {
          nextIssues.push({
            message: 'El contenido es demasiado largo',
            path: ['translations', index, 'contentHtml'],
          })
        }
      }

      if (asTrimmedString(translation.alt).length > 200) {
        nextIssues.push({
          message: 'El texto alternativo no puede superar los 200 caracteres',
          path: ['translations', index, 'alt'],
        })
      }
    }
  )

  const translations = Array.isArray(payload.translations)
    ? payload.translations.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      )
    : []
  const requiredTranslation = translations.find((entry) => entry.locale === DEFAULT_LOCALE_CODE)
  const requiredContentHtml =
    typeof requiredTranslation?.contentHtml === 'string' ? requiredTranslation.contentHtml : null

  if (
    (type === 'press_release' || type === 'statement') &&
    !pdfUrl &&
    !hasMeaningfulHtml(requiredContentHtml)
  ) {
    issues.push({
      message: 'Debes añadir contenido o subir un PDF para notas de prensa y comunicados',
      path: ['translations', 0, 'contentHtml'],
    })
  }

  if (type === 'media_appearance' && !asTrimmedString(externalUrl)) {
    issues.push({
      message: 'La URL externa es obligatoria para apariciones en medios',
      path: ['externalUrl'],
    })
  }

  if (type === 'media_appearance' && !asTrimmedString(mediaOutletId)) {
    issues.push({
      message: 'El medio de comunicación es obligatorio para apariciones en medios',
      path: ['mediaOutletId'],
    })
  }

  const normalizedImage =
    image === undefined || image === null
      ? null
      : typeof image === 'string' && image.trim() === ''
        ? null
        : (image as string).trim()

  return {
    ...(payload as Record<string, unknown>),
    image: normalizedImage,
  } as {
    active: boolean
    externalUrl?: string | null
    image: string | null
    mediaOutletId?: string | null
    pdfUrl?: string | null
    publishedAt?: string
    tagIds: string[]
    translations: Array<{
      alt?: string
      contentHtml?: string | null
      description?: string
      locale: string
      title: string
    }>
    type: string
  }
})
