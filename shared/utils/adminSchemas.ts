import { z } from 'zod'
import { RESERVED_TAG_SLUG } from '~~/shared/constants/tags'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'

const localeSchema = z.enum(SUPPORTED_LOCALE_CODES, {
  message: 'admin.validation.invalidLocale',
})

const optimisticLockFields = {
  updatedAt: z.string().datetime().optional(),
}

const safeHrefSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      (value.startsWith('/') && !value.startsWith('//')) ||
      value.startsWith('#') ||
      value.startsWith('http://') ||
      value.startsWith('https://'),
    'admin.validation.hrefFormat'
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
      message: 'admin.validation.duplicateLocale',
      path: ['translations'],
    })
  }
}

type RequiredTranslationField = { field: string; message: string }

/**
 * Wraps a create-schema with the shared translation rules: no duplicate locales, and each listed
 * field must be a non-empty string on the default-locale translation. Fields are checked in the
 * given order, matching Zod's issue insertion order.
 */
const withTranslationRules = <T extends z.ZodType<{ translations: Array<{ locale: string }> }>>(
  schema: T,
  requiredFields: RequiredTranslationField[]
) =>
  schema.superRefine((data, ctx) => {
    addNoDuplicateLocalesIssue(ctx, data.translations)

    const requiredTranslation = data.translations.find(
      (translation) => translation.locale === DEFAULT_LOCALE_CODE
    ) as Record<string, string | undefined> | undefined

    for (const { field, message } of requiredFields) {
      if (!requiredTranslation?.[field]?.trim()) {
        addRequiredTranslationIssue(ctx, data.translations, field, message)
      }
    }
  })

export const carouselTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  buttonText: z.string().max(100).nullish(),
  alt: z.string().max(200).nullish(),
})

export const createCarouselItemSchema = withTranslationRules(
  z.object({
    /** Omit or null to use the site default carousel image. */
    image: z.preprocess(
      (value) => (value === undefined ? null : value),
      z.union([z.null(), z.string().min(1).max(2048)])
    ),
    href: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z.array(carouselTranslationSchema).min(1, 'admin.validation.translationRequired'),
  }),
  [{ field: 'title', message: 'admin.validation.defaultTitleRequired' }]
)

export const updateCarouselItemSchema = createCarouselItemSchema.safeExtend(optimisticLockFields)

export const featuredLinkTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  alt: z.string().max(200).nullish(),
})

export const createFeaturedLinkSchema = withTranslationRules(
  z.object({
    image: z.string().min(1, 'admin.validation.imageRequired').max(2048),
    to: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(featuredLinkTranslationSchema)
      .min(1, 'admin.validation.translationRequired'),
  }),
  [{ field: 'title', message: 'admin.validation.defaultTitleRequired' }]
)

export const updateFeaturedLinkSchema = createFeaturedLinkSchema.safeExtend(optimisticLockFields)

export const createMediaOutletSchema = z.object({
  name: z.string().min(1, 'admin.validation.nameRequired').max(200),
  website: z.string().url('admin.validation.invalidUrl').max(2048),
  logo: z.string().min(1, 'admin.validation.logoRequired').max(2048),
  order: z.number().int().min(0).default(0),
})

export const updateMediaOutletSchema = createMediaOutletSchema.safeExtend(optimisticLockFields)

export const tagTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().max(100),
})

export const createTagSchema = withTranslationRules(
  z.object({
    slug: z
      .string()
      .min(1, 'admin.validation.slugRequired')
      .max(100)
      .regex(/^[a-z0-9-]+$/, 'admin.validation.slugFormat')
      .refine((value) => value !== RESERVED_TAG_SLUG, 'admin.validation.slugReserved'),
    order: z.number().int().min(0).default(0),
    translations: z.array(tagTranslationSchema).min(1, 'admin.validation.translationRequired'),
  }),
  [{ field: 'name', message: 'admin.validation.defaultNameRequired' }]
)

export const updateTagSchema = createTagSchema.safeExtend(optimisticLockFields)

export const equalityDocumentTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
  description: z.string().max(2000),
  meta: z.string().max(500).optional().nullable(),
})

export const createEqualityDocumentSchema = withTranslationRules(
  z.object({
    pdfUrl: z.string().min(1, 'admin.validation.pdfRequired'),
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(equalityDocumentTranslationSchema)
      .min(1, 'admin.validation.translationRequired'),
  }),
  [
    { field: 'title', message: 'admin.validation.defaultTitleRequired' },
    { field: 'description', message: 'admin.validation.defaultDescriptionRequired' },
  ]
)

export const updateEqualityDocumentSchema =
  createEqualityDocumentSchema.safeExtend(optimisticLockFields)

export const financialReportTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string().max(200),
})

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'admin.validation.invalidDate')

export const createFinancialReportSchema = withTranslationRules(
  z.object({
    pdfUrl: z.string().min(1, 'admin.validation.pdfRequired'),
    approvedAt: dateOnlySchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(financialReportTranslationSchema)
      .min(1, 'admin.validation.translationRequired'),
  }),
  [{ field: 'title', message: 'admin.validation.defaultTitleRequired' }]
)

export const updateFinancialReportSchema =
  createFinancialReportSchema.safeExtend(optimisticLockFields)

export const updatePressDossierSchema = z
  .object({
    pdfUrl: z.string().min(1, 'admin.validation.pdfRequired').nullable(),
    active: z.boolean().default(false),
  })
  .safeExtend(optimisticLockFields)
  .superRefine((data, ctx) => {
    if (data.active && !data.pdfUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'admin.validation.dossierPdfRequired',
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
    'admin.validation.storagePathNotUrl'
  )

export const updateSiteDefaultImagesSchema = z
  .object({
    pressReleaseImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    statementImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    mediaAppearanceImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    newsletterCoverImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    carouselSlideImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    ogImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    activityEntryImage: z.union([z.null(), pressDefaultCoverStoragePath]),
    areaReportImage: z.union([z.null(), pressDefaultCoverStoragePath]),
  })
  .safeExtend(optimisticLockFields)

const newsletterMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'admin.validation.invalidMonth')

export const createNewsletterSchema = z.object({
  month: newsletterMonthSchema,
  /** Omit or null to use the site default newsletter cover image. */
  coverImage: z.preprocess(
    (value) => (value === undefined ? null : value),
    z.union([z.null(), z.string().min(1).max(2048)])
  ),
  pdfUrl: z.string().min(1, 'admin.validation.pdfRequired').max(2048),
  publicVisible: z.boolean().default(true),
})

export const updateNewsletterSchema = createNewsletterSchema.safeExtend(optimisticLockFields)

export const createNewsletterRequestSchema = createNewsletterSchema.extend({
  sendEmail: z.boolean().default(false),
})

// --- Admin schemas without a translatable/image-backed shape (previously in
// server/utils/validation/admin.ts). Consolidated here so every admin zod schema has a single
// server-side definition. ---

export const updateAboutPageContentSchema = z.object({
  heroImage: z.string().min(1, 'admin.validation.imageRequired').nullable(),
  heroVisible: z.boolean().default(false),
  updatedAt: z.string().datetime().optional(),
})

export const updateSubscriberSchema = z.object({
  email: z.string().email('admin.validation.invalidEmail'),
  active: z.boolean(),
})

export const retryFailedJobSchema = z.object({
  jobId: z.string().min(1),
  queue: z.enum(['newsletter', 'maintenance']),
})

export const createAdminAccessSchema = z.object({
  email: z
    .string()
    .trim()
    .email('admin.validation.invalidMail')
    .transform((email) => email.toLowerCase()),
  active: z.boolean().default(true),
})

export const updateAdminAccessSchema = z.object({
  active: z.boolean(),
})

export const adminUploadKindSchema = z.object({
  kind: z.enum(['carousel', 'carousel_default', 'featured_link', 'site_og']),
})

export const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
})
