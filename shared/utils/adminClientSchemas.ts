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

const LOWERCASE_SLUG_PATTERN = /^[a-z0-9-]+$/
const DATE_ONLY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const NEWSLETTER_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-01$/
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

const isNonNegativeInteger = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

const isSafeHref = (value: string) =>
  (value.startsWith('/') && !value.startsWith('//')) ||
  value.startsWith('#') ||
  value.startsWith('http://') ||
  value.startsWith('https://')

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

export const updateAboutPageContentClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const heroImage = payload.heroImage
  const heroVisible = payload.heroVisible

  if (heroImage !== null && (typeof heroImage !== 'string' || heroImage.length === 0)) {
    issues.push({ message: 'La imagen no es válida', path: ['heroImage'] })
  }

  if (typeof heroVisible !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['heroVisible'] })
  }

  if (heroVisible === true && !heroImage) {
    issues.push({
      message: 'Necesitas una imagen para mostrar el banner',
      path: ['heroImage'],
    })
  }

  return payload as { heroImage: string | null; heroVisible: boolean }
})

export const createAdminAccessClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const email = asTrimmedString(payload.email)
  if (!email) {
    issues.push({ message: 'El correo es obligatorio', path: ['email'] })
  } else if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push({ message: 'El correo no es válido', path: ['email'] })
  }

  if (payload.active !== undefined && typeof payload.active !== 'boolean') {
    issues.push({ message: 'Estado no válido', path: ['active'] })
  }

  return {
    active: payload.active === undefined ? true : payload.active,
    email: email.toLowerCase(),
  }
})

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

export const updateSiteDefaultImagesClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'Entrada no válida', path: [] })
    return null
  }

  const validateSlot = (key: string, value: unknown) => {
    if (value === undefined) {
      issues.push({ message: 'Este campo es obligatorio', path: [key] })
      return
    }
    if (value === null) {
      return
    }
    if (typeof value !== 'string') {
      issues.push({ message: 'La imagen no es válida', path: [key] })
      return
    }
    const t = value.trim()
    if (!t) {
      return
    }
    if (t.length > 2048) {
      issues.push({ message: 'La imagen no es válida', path: [key] })
    } else if (t.startsWith('http://') || t.startsWith('https://')) {
      issues.push({
        message: 'La imagen debe ser una ruta interna, no una URL externa',
        path: [key],
      })
    }
  }

  validateSlot('pressReleaseImage', payload.pressReleaseImage)
  validateSlot('statementImage', payload.statementImage)
  validateSlot('mediaAppearanceImage', payload.mediaAppearanceImage)
  validateSlot('newsletterCoverImage', payload.newsletterCoverImage)
  validateSlot('carouselSlideImage', payload.carouselSlideImage)

  if (typeof payload.updatedAt !== 'string' && payload.updatedAt !== undefined) {
    issues.push({ message: 'Fecha de versión no válida', path: ['updatedAt'] })
  }

  const normalize = (value: unknown) => {
    if (value === null || value === undefined) return null
    if (typeof value !== 'string') return null
    const t = value.trim()
    return t.length ? t : null
  }

  return {
    pressReleaseImage: normalize(payload.pressReleaseImage),
    statementImage: normalize(payload.statementImage),
    mediaAppearanceImage: normalize(payload.mediaAppearanceImage),
    newsletterCoverImage: normalize(payload.newsletterCoverImage),
    carouselSlideImage: normalize(payload.carouselSlideImage),
    updatedAt: payload.updatedAt as string | undefined,
  }
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

  const imageRaw = payload.image
  const image =
    imageRaw === undefined || imageRaw === null
      ? null
      : typeof imageRaw === 'string'
        ? imageRaw.trim()
        : ''
  const href = asTrimmedString(payload.href)

  if (image !== null && image.length > 2048) {
    issues.push({ message: 'La ruta de imagen no es válida', path: ['image'] })
  }
  if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
    issues.push({
      message: 'La imagen debe ser una ruta interna, no una URL externa',
      path: ['image'],
    })
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

  return {
    ...(payload as Record<string, unknown>),
    image: image && image.length > 0 ? image : null,
  } as {
    active: boolean
    href: string
    image: string | null
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
  const coverRaw = payload.coverImage
  const coverImage =
    coverRaw === undefined || coverRaw === null
      ? null
      : typeof coverRaw === 'string'
        ? coverRaw.trim()
        : null
  const pdfUrl = asTrimmedString(payload.pdfUrl)
  const publicVisible = payload.publicVisible
  const sendEmail = payload.sendEmail

  if (!NEWSLETTER_MONTH_PATTERN.test(month)) {
    issues.push({ message: 'El mes no es válido', path: ['month'] })
  }

  if (coverImage && coverImage.length > 2048) {
    issues.push({ message: 'La imagen de portada no es válida', path: ['coverImage'] })
  }
  if (coverImage && (coverImage.startsWith('http://') || coverImage.startsWith('https://'))) {
    issues.push({
      message: 'La imagen debe ser una ruta interna, no una URL externa',
      path: ['coverImage'],
    })
  }

  if (!pdfUrl || pdfUrl.length > 2048) {
    issues.push({ message: 'El PDF es requerido', path: ['pdfUrl'] })
  }

  if (typeof publicVisible !== 'boolean') {
    issues.push({ message: 'Visibilidad no válida', path: ['publicVisible'] })
  }

  if (typeof sendEmail !== 'boolean') {
    issues.push({ message: 'Envío no válido', path: ['sendEmail'] })
  }

  if (sendEmail === true && publicVisible !== true) {
    issues.push({
      message: 'La newsletter debe estar visible para poder enviarla',
      path: ['sendEmail'],
    })
  }

  return {
    ...(payload as Record<string, unknown>),
    coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
  } as {
    coverImage: string | null
    month: string
    pdfUrl: string
    publicVisible: boolean
    sendEmail: boolean
  }
})
