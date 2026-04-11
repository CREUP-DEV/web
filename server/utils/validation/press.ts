import { z } from 'zod'
import { hasMeaningfulRichTextHtml } from '../pressTranslation'
import {
  dateOnlySchema,
  getRequiredLocaleTranslation,
  localeSchema,
  toOptionalSingleStringSchema,
} from './helpers'
import { ADMIN_RICH_TEXT_MAX_HTML_LENGTH } from '~~/shared/utils/richText'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'

export const pressArticleTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  description: z.string().max(2000).optional(),
  contentHtml: z.string().max(ADMIN_RICH_TEXT_MAX_HTML_LENGTH).optional().nullable(),
  alt: z.string().max(200).optional(),
})

export const pressArticleTypeSchema = z.enum(PRESS_ARTICLE_TYPES)

function refinePressArticle(
  data: {
    type: string
    pdfUrl?: string | null
    externalUrl?: string | null
    mediaOutletId?: string | null
    translations: Array<{ locale: string; title?: string; contentHtml?: string | null }>
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
  if (
    (data.type === 'press_release' || data.type === 'statement') &&
    !data.pdfUrl &&
    !hasMeaningfulRichTextHtml(requiredTranslation?.contentHtml)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes añadir contenido o subir un PDF para notas de prensa y comunicados',
      path: ['translations'],
    })
  }
  if (data.type === 'media_appearance' && !data.externalUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La URL externa es obligatoria para apariciones en medios',
      path: ['externalUrl'],
    })
  }
  if (data.type === 'media_appearance' && !data.mediaOutletId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El medio de comunicación es obligatorio para apariciones en medios',
      path: ['mediaOutletId'],
    })
  }

  const locales = data.translations.map((t) => t.locale)
  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No puede haber traducciones duplicadas para el mismo idioma',
      path: ['translations'],
    })
  }
}

const basePressArticleSchema = z.object({
  type: pressArticleTypeSchema,
  image: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine(
      (v) => !v.startsWith('http://') && !v.startsWith('https://'),
      'La imagen debe ser una ruta de almacenamiento, no una URL'
    )
    .optional()
    .nullable(),
  pdfUrl: toOptionalSingleStringSchema(z.string().trim().min(1)),
  externalUrl: toOptionalSingleStringSchema(z.string().trim().url('La URL externa no es válida')),
  mediaOutletId: toOptionalSingleStringSchema(z.string().trim().min(1)),
  active: z.boolean().default(true),
  tagIds: z
    .array(z.string())
    .optional()
    .default([])
    .transform((ids) => [...new Set(ids)]),
  publishedAt: dateOnlySchema.optional(),
  translations: z
    .array(pressArticleTranslationSchema)
    .min(1, 'Se requiere al menos una traducción'),
})

export const createPressArticleSchema = basePressArticleSchema.superRefine(refinePressArticle)

export const updatePressArticleSchema = basePressArticleSchema
  .merge(z.object({ updatedAt: z.string().datetime().optional() }))
  .superRefine(refinePressArticle)

export const pressListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    pressArticleTypeSchema.optional()
  ),
  tag: toOptionalSingleStringSchema(
    z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine((value) => value !== 'all', "El slug 'all' no es válido como filtro")
  ),
  limit: toOptionalSingleStringSchema(z.coerce.number().int().min(1).max(50).default(12)),
  offset: toOptionalSingleStringSchema(z.coerce.number().int().min(0).default(0)),
})

export const tagsListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    pressArticleTypeSchema.optional()
  ),
})

export const adminPressListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    pressArticleTypeSchema.optional()
  ),
  search: toOptionalSingleStringSchema(z.string().trim().max(200)),
})
