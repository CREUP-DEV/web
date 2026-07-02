// Client-side validators for the activity admin forms. Hand-written (not zod) for the same reason
// as the press form: the server activity schema (server/utils/validation/activity.ts) imports a
// server-only rich-text sanitizer (hasMeaningfulRichTextHtml) that cannot run in the client bundle.
// These mirror the server's es-required checks; the server enforces the rest and surfaces messages
// via toast. The emitted issue-path shape matches zod's safeParse so it plugs into useFormValidation.
import { ACTIVITY_KINDS, MEMBER_ORG_SOURCES } from '~~/shared/constants/activity'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'
import { ADMIN_RICH_TEXT_MAX_HTML_LENGTH, hasMeaningfulHtml } from '~~/shared/utils/richText'

type ValidationIssue = {
  message: string
  path: Array<string | number>
}

type ValidationResult<TPayload> =
  | { data: TPayload; success: true }
  | { error: { issues: ValidationIssue[] }; success: false }

export interface ClientValidatableSchema<TPayload> {
  safeParse(payload: unknown): ValidationResult<TPayload>
}

const DATE_ONLY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const ACTIVITY_KIND_SET = new Set<string>(ACTIVITY_KINDS)
const MEMBER_ORG_SOURCE_SET = new Set<string>(MEMBER_ORG_SOURCES)

const ok = <TPayload>(data: TPayload): ValidationResult<TPayload> => ({ data, success: true })
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

const validateImagePath = (image: unknown, issues: ValidationIssue[]) => {
  if (image === null || image === undefined) return
  if (typeof image !== 'string') {
    issues.push({ message: 'admin.validation.invalidCoverImage', path: ['image'] })
  } else if (image.trim() === '') {
    // omit — treated as no custom image
  } else if (image.length > 2048) {
    issues.push({ message: 'admin.validation.invalidImage', path: ['image'] })
  } else if (image.startsWith('http://') || image.startsWith('https://')) {
    issues.push({ message: 'admin.validation.imageMustBeInternal', path: ['image'] })
  }
}

const normalizeImage = (image: unknown): string | null => {
  if (image === undefined || image === null) return null
  if (typeof image === 'string') {
    const trimmed = image.trim()
    return trimmed === '' ? null : trimmed
  }
  return null
}

export const activityEntryClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'admin.validation.invalidInput', path: [] })
    return null
  }

  const kind = asTrimmedString(payload.kind)
  const startDate = payload.startDate
  const endDate = payload.endDate
  const isOnline = payload.isOnline
  const memberOrgSource = payload.memberOrgSource
  const memberOrgId = payload.memberOrgId
  const active = payload.active

  if (!ACTIVITY_KIND_SET.has(kind)) {
    issues.push({ message: 'admin.validation.invalidActivityKind', path: ['kind'] })
  }

  validateImagePath(payload.image, issues)

  if (typeof startDate !== 'string' || !DATE_ONLY_PATTERN.test(startDate)) {
    issues.push({ message: 'admin.validation.invalidStartDate', path: ['startDate'] })
  }

  if (endDate !== null && endDate !== undefined && endDate !== '') {
    if (typeof endDate !== 'string' || !DATE_ONLY_PATTERN.test(endDate)) {
      issues.push({ message: 'admin.validation.invalidEndDate', path: ['endDate'] })
    } else if (typeof startDate === 'string' && endDate < startDate) {
      issues.push({ message: 'admin.validation.endDateBeforeStart', path: ['endDate'] })
    }
  }

  if (typeof isOnline !== 'boolean') {
    issues.push({ message: 'admin.validation.invalidActive', path: ['isOnline'] })
  }

  if (typeof active !== 'boolean') {
    issues.push({ message: 'admin.validation.invalidActive', path: ['active'] })
  }

  if (kind === 'member') {
    if (typeof memberOrgSource !== 'string' || !MEMBER_ORG_SOURCE_SET.has(memberOrgSource)) {
      issues.push({ message: 'admin.validation.memberOrgRequired', path: ['memberOrgId'] })
    }
    if (typeof memberOrgId !== 'string' || !memberOrgId.trim()) {
      issues.push({ message: 'admin.validation.memberOrgRequired', path: ['memberOrgId'] })
    }
  }

  // Translations: es title required, supported locales, no duplicates, length bounds.
  const translations = payload.translations
  if (!Array.isArray(translations) || translations.length === 0) {
    issues.push({ message: 'admin.validation.translationRequired', path: ['translations'] })
  } else {
    const locales: string[] = []
    let defaultIndex = -1
    translations.forEach((entry, index) => {
      if (!isPlainObject(entry)) {
        issues.push({
          message: 'admin.validation.invalidTranslation',
          path: ['translations', index],
        })
        return
      }
      if (!isSupportedLocale(entry.locale)) {
        issues.push({
          message: 'admin.validation.invalidLocale',
          path: ['translations', index, 'locale'],
        })
        return
      }
      locales.push(entry.locale)
      if (entry.locale === DEFAULT_LOCALE_CODE) defaultIndex = index

      if (asTrimmedString(entry.title).length > 200) {
        issues.push({
          message: 'admin.validation.titleTooLong',
          path: ['translations', index, 'title'],
        })
      }
      if (asTrimmedString(entry.excerpt).length > 2000) {
        issues.push({
          message: 'admin.validation.descriptionTooLong',
          path: ['translations', index, 'excerpt'],
        })
      }
      if (entry.contentHtml != null) {
        if (typeof entry.contentHtml !== 'string') {
          issues.push({
            message: 'admin.validation.invalidContent',
            path: ['translations', index, 'contentHtml'],
          })
        } else if (entry.contentHtml.length > ADMIN_RICH_TEXT_MAX_HTML_LENGTH) {
          issues.push({
            message: 'admin.validation.contentTooLong',
            path: ['translations', index, 'contentHtml'],
          })
        }
      }
      if (asTrimmedString(entry.alt).length > 200) {
        issues.push({
          message: 'admin.validation.altTooLong',
          path: ['translations', index, 'alt'],
        })
      }
    })

    if (new Set(locales).size !== locales.length) {
      issues.push({ message: 'admin.validation.duplicateLocale', path: ['translations'] })
    }

    if (defaultIndex === -1 || !asTrimmedString(translations[defaultIndex]?.title)) {
      issues.push({
        message: 'admin.validation.defaultTitleRequired',
        path: ['translations', Math.max(defaultIndex, 0), 'title'],
      })
    }
  }

  return {
    ...(payload as Record<string, unknown>),
    image: normalizeImage(payload.image),
  } as Record<string, unknown>
})

export const areaReportClientSchema = buildValidator((payload, issues) => {
  if (!isPlainObject(payload)) {
    issues.push({ message: 'admin.validation.invalidInput', path: [] })
    return null
  }

  const monthKey = payload.monthKey
  const coversFrom = payload.coversFrom
  const areaId = payload.areaId
  const active = payload.active

  if (typeof monthKey !== 'string' || !MONTH_KEY_PATTERN.test(monthKey)) {
    issues.push({ message: 'admin.validation.invalidMonth', path: ['monthKey'] })
  }

  if (coversFrom !== null && coversFrom !== undefined && coversFrom !== '') {
    if (typeof coversFrom !== 'string' || !MONTH_KEY_PATTERN.test(coversFrom)) {
      issues.push({ message: 'admin.validation.invalidMonth', path: ['coversFrom'] })
    } else if (typeof monthKey === 'string' && coversFrom > monthKey) {
      issues.push({ message: 'admin.validation.coversFromAfterMonth', path: ['coversFrom'] })
    }
  }

  if (typeof areaId !== 'number' || !Number.isInteger(areaId) || areaId < 1) {
    issues.push({ message: 'admin.validation.areaRequired', path: ['areaId'] })
  }

  validateImagePath(payload.image, issues)

  if (typeof active !== 'boolean') {
    issues.push({ message: 'admin.validation.invalidActive', path: ['active'] })
  }

  const translations = payload.translations
  if (!Array.isArray(translations) || translations.length === 0) {
    issues.push({ message: 'admin.validation.translationRequired', path: ['translations'] })
  } else {
    const locales: string[] = []
    let defaultIndex = -1
    translations.forEach((entry, index) => {
      if (!isPlainObject(entry)) {
        issues.push({
          message: 'admin.validation.invalidTranslation',
          path: ['translations', index],
        })
        return
      }
      if (!isSupportedLocale(entry.locale)) {
        issues.push({
          message: 'admin.validation.invalidLocale',
          path: ['translations', index, 'locale'],
        })
        return
      }
      locales.push(entry.locale)
      if (entry.locale === DEFAULT_LOCALE_CODE) defaultIndex = index

      if (entry.contentHtml != null) {
        if (typeof entry.contentHtml !== 'string') {
          issues.push({
            message: 'admin.validation.invalidContent',
            path: ['translations', index, 'contentHtml'],
          })
        } else if (entry.contentHtml.length > ADMIN_RICH_TEXT_MAX_HTML_LENGTH) {
          issues.push({
            message: 'admin.validation.contentTooLong',
            path: ['translations', index, 'contentHtml'],
          })
        }
      }
      if (asTrimmedString(entry.imageCaption).length > 300) {
        issues.push({
          message: 'admin.validation.captionTooLong',
          path: ['translations', index, 'imageCaption'],
        })
      }
      if (asTrimmedString(entry.alt).length > 200) {
        issues.push({
          message: 'admin.validation.altTooLong',
          path: ['translations', index, 'alt'],
        })
      }
    })

    if (new Set(locales).size !== locales.length) {
      issues.push({ message: 'admin.validation.duplicateLocale', path: ['translations'] })
    }

    const defaultTranslation = defaultIndex >= 0 ? translations[defaultIndex] : null
    const defaultContent =
      defaultTranslation && typeof defaultTranslation.contentHtml === 'string'
        ? defaultTranslation.contentHtml
        : null
    if (!hasMeaningfulHtml(defaultContent)) {
      issues.push({
        message: 'admin.validation.defaultContentRequired',
        path: ['translations', Math.max(defaultIndex, 0), 'contentHtml'],
      })
    }
  }

  return {
    ...(payload as Record<string, unknown>),
    image: normalizeImage(payload.image),
  } as Record<string, unknown>
})
