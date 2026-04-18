import { z } from 'zod'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'

const localeSchema = z.enum(SUPPORTED_LOCALE_CODES, {
  message: 'Invalid locale / El locale no es válido',
})

const optimisticLockSchema = z.object({
  updatedAt: z.string().datetime().optional(),
})

const safeHrefSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      (value.startsWith('/') && !value.startsWith('//')) ||
      value.startsWith('#') ||
      value.startsWith('http://') ||
      value.startsWith('https://'),
    'El enlace debe ser una ruta relativa o una URL http/https'
  )

const getRequiredTranslationIndex = <T extends { locale: string }>(translations: T[]) =>
  translations.findIndex((translation) => translation.locale === DEFAULT_LOCALE_CODE)

const addRequiredTranslationIssue = (
  ctx: z.RefinementCtx,
  translations: Array<{ locale: string }>,
  field: string,
  message: string
) => {
  const requiredIndex = getRequiredTranslationIndex(translations)

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: requiredIndex >= 0 ? ['translations', requiredIndex, field] : ['translations'],
  })
}

const addNoDuplicateLocalesIssue = (
  ctx: z.RefinementCtx,
  translations: Array<{ locale: string }>
) => {
  const locales = translations.map((translation) => translation.locale)

  if (new Set(locales).size !== locales.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No puede haber traducciones duplicadas para el mismo idioma',
      path: ['translations'],
    })
  }
}

export const carouselTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  buttonText: z.string().max(100).nullish(),
  alt: z.string().max(200).nullish(),
})

export const createCarouselItemSchema = z
  .object({
    /** Omit or null to use the site default carousel image. */
    image: z.preprocess(
      (value) => (value === undefined ? null : value),
      z.union([z.null(), z.string().min(1).max(2048)])
    ),
    href: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z.array(carouselTranslationSchema).min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    )

    if (!requiredTranslation?.title?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'title',
        'El título en español es obligatorio'
      )
    }
  })

export const updateCarouselItemSchema = createCarouselItemSchema.merge(optimisticLockSchema)

export const featuredLinkTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  alt: z.string().max(200).nullish(),
})

export const createFeaturedLinkSchema = z
  .object({
    image: z.string().min(1, 'La imagen es requerida').max(2048),
    to: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(featuredLinkTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    )

    if (!requiredTranslation?.title?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'title',
        'El título en español es obligatorio'
      )
    }
  })

export const updateFeaturedLinkSchema = createFeaturedLinkSchema.merge(optimisticLockSchema)

export const createMediaOutletSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  website: z.string().url('La URL no es válida').max(2048),
  logo: z.string().min(1, 'El logo es requerido').max(2048),
  order: z.number().int().min(0).default(0),
})

export const updateMediaOutletSchema = createMediaOutletSchema.merge(optimisticLockSchema)

export const tagTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().max(100),
})

export const createTagSchema = z
  .object({
    slug: z
      .string()
      .min(1, 'El slug es requerido')
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
      .refine((value) => value !== 'all', "El slug 'all' está reservado"),
    order: z.number().int().min(0).default(0),
    translations: z.array(tagTranslationSchema).min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    )

    if (!requiredTranslation?.name?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'name',
        'El nombre en español es obligatorio'
      )
    }
  })

export const updateTagSchema = createTagSchema.merge(optimisticLockSchema)

export const equalityDocumentTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  description: z.string().max(2000),
  meta: z.string().max(500).optional().nullable(),
})

export const createEqualityDocumentSchema = z
  .object({
    pdfUrl: z.string().min(1, 'El PDF es requerido'),
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(equalityDocumentTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    )

    if (!requiredTranslation?.title?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'title',
        'El título en español es obligatorio'
      )
    }

    if (!requiredTranslation?.description?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'description',
        'La descripción en español es obligatoria'
      )
    }
  })

export const updateEqualityDocumentSchema = createEqualityDocumentSchema.merge(optimisticLockSchema)

export const financialReportTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
})

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'La fecha no es válida')

export const createFinancialReportSchema = z
  .object({
    pdfUrl: z.string().min(1, 'El PDF es requerido'),
    approvedAt: dateOnlySchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(financialReportTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    )

    if (!requiredTranslation?.title?.trim()) {
      addRequiredTranslationIssue(
        ctx,
        data.translations,
        'title',
        'El título en español es obligatorio'
      )
    }
  })

export const updateFinancialReportSchema = createFinancialReportSchema.merge(optimisticLockSchema)

export const updatePressDossierSchema = z
  .object({
    pdfUrl: z.string().min(1, 'El PDF es requerido').nullable(),
    active: z.boolean().default(false),
  })
  .merge(optimisticLockSchema)
  .superRefine((data, ctx) => {
    if (data.active && !data.pdfUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes subir un PDF para activar el dossier',
        path: ['pdfUrl'],
      })
    }
  })

const pressDefaultCoverStoragePath = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (v) => !v.startsWith('http://') && !v.startsWith('https://'),
    'La imagen debe ser una ruta de almacenamiento, no una URL'
  )

export const updateSiteDefaultImagesSchema = z
  .object({
    pressReleaseImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    statementImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    mediaAppearanceImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    newsletterCoverImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    carouselSlideImage: z.union([z.null(), pressDefaultCoverStoragePath]),
  })
  .merge(optimisticLockSchema)

const newsletterMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'El mes no es válido')

export const createNewsletterSchema = z.object({
  month: newsletterMonthSchema,
  /** Omit or null to use the site default newsletter cover image. */
  coverImage: z.preprocess(
    (value) => (value === undefined ? null : value),
    z.union([z.null(), z.string().min(1).max(2048)])
  ),
  pdfUrl: z.string().min(1, 'El PDF es requerido').max(2048),
  publicVisible: z.boolean().default(true),
})

export const updateNewsletterSchema = createNewsletterSchema.merge(optimisticLockSchema)

export const createNewsletterRequestSchema = createNewsletterSchema.extend({
  sendEmail: z.boolean().default(false),
})
