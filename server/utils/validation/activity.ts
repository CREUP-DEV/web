import { z } from 'zod'
import { dateOnlySchema, getRequiredLocaleTranslation, localeSchema } from './helpers'
import { hasMeaningfulRichTextHtml } from '../press/pressTranslation'
import { ADMIN_RICH_TEXT_MAX_HTML_LENGTH } from '~~/shared/utils/richText'
import { ACTIVITY_KINDS, MEMBER_ORG_SOURCES } from '~~/shared/constants/activity'

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export const activityKindSchema = z.enum(ACTIVITY_KINDS)
export const memberOrgSourceSchema = z.enum(MEMBER_ORG_SOURCES)

export const activityEntryTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  excerpt: z.string().max(2000).optional().nullable(),
  contentHtml: z.string().max(ADMIN_RICH_TEXT_MAX_HTML_LENGTH).optional().nullable(),
  imageCaption: z.string().max(300).optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
})

// Storage path, never a URL (the upload endpoint returns a storage path).
const optionalActivityImage = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z
    .union([
      z.null(),
      z
        .string()
        .trim()
        .min(1)
        .max(2048)
        .refine(
          (value) => !value.startsWith('http://') && !value.startsWith('https://'),
          'La imagen debe ser una ruta de almacenamiento, no una URL'
        ),
    ])
    .optional()
)

// Empty/whitespace -> null; otherwise the trimmed string.
const optionalLocation = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.union([z.literal('').transform(() => null), z.string().max(300), z.null()]).optional()
)

function refineActivityEntry(
  data: {
    kind: string
    isOnline?: boolean
    location?: string | null
    startDate: string
    endDate?: string | null
    memberOrgSource?: string | null
    memberOrgId?: string | null
    translations: Array<{ locale: string; title?: string }>
  },
  ctx: z.RefinementCtx
) {
  const requiredTranslation = getRequiredLocaleTranslation(data.translations)
  if (!requiredTranslation?.title?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El título en español es obligatorio',
      path: ['translations'],
    })
  }

  const locales = data.translations.map((translation) => translation.locale)
  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No puede haber traducciones duplicadas para el mismo idioma',
      path: ['translations'],
    })
  }

  if (data.kind === 'member') {
    if (!data.memberOrgSource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la organización para eventos de miembros',
        path: ['memberOrgSource'],
      })
    }
    if (!data.memberOrgId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la organización para eventos de miembros',
        path: ['memberOrgId'],
      })
    }
  }

  if (data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de fin no puede ser anterior a la de inicio',
      path: ['endDate'],
    })
  }
}

const baseActivityEntrySchema = z.object({
  kind: activityKindSchema,
  image: optionalActivityImage,
  startDate: dateOnlySchema,
  endDate: dateOnlySchema.optional().nullable(),
  isOnline: z.boolean().default(false),
  location: optionalLocation,
  memberOrgSource: memberOrgSourceSchema.optional().nullable(),
  memberOrgId: z.string().trim().min(1).max(200).optional().nullable(),
  active: z.boolean().default(true),
  translations: z
    .array(activityEntryTranslationSchema)
    .min(1, 'Se requiere al menos una traducción'),
})

export const createActivityEntrySchema = baseActivityEntrySchema.superRefine(refineActivityEntry)

export const updateActivityEntrySchema = baseActivityEntrySchema
  .safeExtend({
    updatedAt: z.string().datetime().optional(),
    // Set by the "Actualizar datos desde el organigrama" button to force a re-snapshot of the
    // organiser even when the reference itself did not change (plan §5.4).
    refreshSnapshot: z.boolean().optional(),
  })
  .superRefine(refineActivityEntry)

export const activityListQuerySchema = z.object({
  kind: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    activityKindSchema.optional()
  ),
  month: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z
      .string()
      .trim()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El mes no es válido')
      .optional()
  ),
  q: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().max(200).optional()
  ),
  limit: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(1).max(50).default(12)
  ),
  offset: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(0).max(10000).default(0)
  ),
})

export const adminActivityListQuerySchema = z.object({
  kind: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    activityKindSchema.optional()
  ),
  search: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().max(200).optional()
  ),
})

// --- Area reports -------------------------------------------------------------------------------

export const areaReportTranslationSchema = z.object({
  locale: localeSchema,
  contentHtml: z.string().max(ADMIN_RICH_TEXT_MAX_HTML_LENGTH).optional().nullable(),
  imageCaption: z.string().max(300).optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
})

function refineAreaReport(
  data: {
    monthKey: string
    coversFrom?: string | null
    translations: Array<{ locale: string; contentHtml?: string | null }>
  },
  ctx: z.RefinementCtx
) {
  const requiredTranslation = getRequiredLocaleTranslation(data.translations)
  if (!hasMeaningfulRichTextHtml(requiredTranslation?.contentHtml)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El contenido en español es obligatorio',
      path: ['translations'],
    })
  }

  const locales = data.translations.map((translation) => translation.locale)
  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No puede haber traducciones duplicadas para el mismo idioma',
      path: ['translations'],
    })
  }

  // Lexicographic comparison is valid because both share the zero-padded 'YYYY-MM' format.
  if (data.coversFrom && data.coversFrom > data.monthKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El inicio del periodo no puede ser posterior al mes de la edición',
      path: ['coversFrom'],
    })
  }
}

const baseAreaReportSchema = z.object({
  monthKey: z.string().trim().regex(MONTH_KEY_PATTERN, 'El mes no es válido'),
  coversFrom: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().trim().regex(MONTH_KEY_PATTERN, 'El mes no es válido').nullable().optional()
  ),
  areaId: z.coerce.number().int().min(1, 'El área no es válida'),
  image: optionalActivityImage,
  active: z.boolean().default(true),
  translations: z.array(areaReportTranslationSchema).min(1, 'Se requiere al menos una traducción'),
})

export const createAreaReportSchema = baseAreaReportSchema.superRefine(refineAreaReport)

// The area is fixed at creation, so an edition update never carries (or re-resolves) areaId.
export const updateAreaReportSchema = baseAreaReportSchema
  .omit({ areaId: true })
  .safeExtend({
    updatedAt: z.string().datetime().optional(),
  })
  .superRefine(refineAreaReport)

export const areaReportsMonthQuerySchema = z.object({
  month: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().regex(MONTH_KEY_PATTERN, 'El mes no es válido')
  ),
})

export const adminAreaReportListQuerySchema = z.object({
  month: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.string().trim().regex(MONTH_KEY_PATTERN).optional()
  ),
})
