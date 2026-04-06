import type { H3Event, MultiPartData } from 'h3'
import { createError, getQuery, getRouterParam } from 'h3'
import {
  CONTACT_FIELD_LIMITS,
  isValidOptionalContactPhone,
} from '~~/shared/utils/contactValidation'
import { DATE_ONLY_PATTERN, parseDateOnlyString } from '~~/shared/utils/date'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'
import { z } from 'zod'
import { hasMeaningfulRichTextHtml } from './pressTranslation'

const localeSchema = z.enum(SUPPORTED_LOCALE_CODES, {
  message: 'El locale no es válido',
})

/** Validates that a URL/path is safe (no javascript: protocol) */
const safeHrefSchema = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith('/') ||
      value.startsWith('#') ||
      value.startsWith('http://') ||
      value.startsWith('https://'),
    'El enlace debe ser una ruta relativa o una URL http/https'
  )
const dateOnlySchema = z
  .string()
  .regex(DATE_ONLY_PATTERN, 'La fecha no es válida')
  .refine((value) => parseDateOnlyString(value) !== null, 'La fecha no es válida')
const getSingleValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

const toSingleStringSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => getSingleValue(value), schema)

const toOptionalSingleStringSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    const normalizedValue = getSingleValue(value)
    if (normalizedValue === '' || normalizedValue == null) {
      return undefined
    }
    return normalizedValue
  }, schema.optional())

const getRequiredTranslation = <T extends { locale: string }>(translations: T[]) =>
  translations.find((translation) => translation.locale === DEFAULT_LOCALE_CODE)

export const carouselTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  buttonText: z.string().optional(),
  alt: z.string().optional(),
})

export const createCarouselItemSchema = z
  .object({
    image: z.string().min(1, 'La imagen es requerida'),
    href: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z.array(carouselTranslationSchema).min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    const requiredTranslation = getRequiredTranslation(data.translations)

    if (!requiredTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }
  })

export const updateCarouselItemSchema = createCarouselItemSchema

export const pressArticleTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  description: z.string().optional(),
  contentHtml: z.string().optional().nullable(),
  alt: z.string().optional(),
})

export const pressArticleTypeSchema = z.enum(PRESS_ARTICLE_TYPES)

/** Shared refinement for press article business rules (used by both create and update) */
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
  const requiredTranslation = getRequiredTranslation(data.translations)

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
}

const basePressArticleSchema = z.object({
  type: pressArticleTypeSchema,
  image: z.string().min(1, 'La imagen es requerida'),
  pdfUrl: z.string().optional().nullable(),
  externalUrl: z.string().url('La URL externa no es válida').optional().nullable(),
  mediaOutletId: z.string().optional().nullable(),
  active: z.boolean().default(true),
  tagIds: z.array(z.string()).optional().default([]),
  publishedAt: dateOnlySchema.optional(),
  translations: z
    .array(pressArticleTranslationSchema)
    .min(1, 'Se requiere al menos una traducción'),
})

export const createPressArticleSchema = basePressArticleSchema.superRefine(refinePressArticle)

export const updatePressArticleSchema = basePressArticleSchema.superRefine(refinePressArticle)

export const featuredLinkTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  alt: z.string().optional(),
})

export const createFeaturedLinkSchema = z
  .object({
    image: z.string().min(1, 'La imagen es requerida'),
    to: safeHrefSchema,
    order: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
    translations: z
      .array(featuredLinkTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    const requiredTranslation = getRequiredTranslation(data.translations)

    if (!requiredTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }
  })

export const updateFeaturedLinkSchema = createFeaturedLinkSchema

export const tagTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string(),
})

export const createTagSchema = z
  .object({
    slug: z
      .string()
      .min(1, 'El slug es requerido')
      .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
    order: z.number().int().min(0).default(0),
    translations: z.array(tagTranslationSchema).min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    const requiredTranslation = getRequiredTranslation(data.translations)

    if (!requiredTranslation?.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre en español es obligatorio',
        path: ['translations'],
      })
    }
  })

export const updateTagSchema = createTagSchema

export const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
})

export const idRouteParamSchema = z.object({
  id: z.string().trim().min(1, 'ID requerido'),
})

export const numericIdRouteParamSchema = z.object({
  id: z.coerce.number().int().min(1, 'ID no válido'),
})

export const slugRouteParamSchema = z.object({
  slug: z.string().trim().min(1, 'Slug requerido'),
})

export const mandateSlugRouteParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'El mandato debe tener formato YYYY, YYYY-MM o YYYY-MM-DD'),
})

export const newsletterTokenQuerySchema = z.object({
  token: toSingleStringSchema(z.string().trim().min(1, 'Token requerido')),
})

export const pressListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    pressArticleTypeSchema.optional()
  ),
  tag: toOptionalSingleStringSchema(z.string().trim()),
  limit: z.preprocess((value) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value
    if (normalizedValue === '' || normalizedValue == null) {
      return undefined
    }
    return normalizedValue
  }, z.coerce.number().int().min(1).max(50).default(12)),
})

export const adminPressListQuerySchema = z.object({
  type: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    pressArticleTypeSchema.optional()
  ),
})

export const memberCalendarQuerySchema = z.object({
  calendarId: toOptionalSingleStringSchema(z.string().trim().email('El calendario no es válido')),
})

export const externalAssetTypeRouteParamSchema = z.object({
  type: z.enum(['image', 'pdf']),
})

export const adminAssetPathRouteParamSchema = z.object({
  path: z.string().trim().min(1, 'Ruta no válida'),
})

// External members API schemas

/** Shared social network schema used across all external member types */
const externalSocialNetworkSchema = z.object({
  network: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
})

export const externalAssociatedMemberSocialSchema = externalSocialNetworkSchema

export const externalAssociatedMemberSchema = z.object({
  order: z.coerce.number().int().default(0),
  denomination: z.string().nullable().optional(),
  initials: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  autonomous_community: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  web_logo_light: z.string().nullable().optional(),
  web_logo_dark: z.string().nullable().optional(),
  social_networks: z.array(externalAssociatedMemberSocialSchema).nullable().optional().default([]),
})

export const externalAssociatedMembersResponseSchema = z.object({
  data: z.array(externalAssociatedMemberSchema),
  generated_at: z.string().nullable().optional(),
})

export const externalAssociatedMembersCountResponseSchema = z.coerce.number().int().min(0)

export const externalAssetQuerySchema = z.object({
  src: z.string().trim().min(1),
})

export const externalAssetPublicPathParamSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .regex(/^[A-Za-z0-9%/:._-]+$/)
    .refine((value) => {
      try {
        const decoded = decodeURIComponent(value)
        return !decoded.includes('..') && !decoded.includes('\\')
      } catch {
        return false
      }
    }, 'La ruta contiene caracteres no permitidos'),
})

export const membersLogoQuerySchema = externalAssetQuerySchema

// External sectorial members API schemas
export const externalSectorialMemberSocialSchema = externalSocialNetworkSchema

export const externalSectorialMemberSchema = z.object({
  order: z.coerce.number().int().default(0),
  denomination: z.string().nullable().optional(),
  initials: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  web_logo_light: z.string().nullable().optional(),
  web_logo_dark: z.string().nullable().optional(),
  social_networks: z.array(externalSectorialMemberSocialSchema).nullable().optional().default([]),
})

export const externalSectorialMembersResponseSchema = z.object({
  data: z.array(externalSectorialMemberSchema),
  generated_at: z.string().nullable().optional(),
})

// External organigrama (org chart) API schemas
export const externalOrganigramaMemberSocialSchema = externalSocialNetworkSchema

export const externalOrganigramaMemberSchema = z.object({
  order: z.coerce.number().int().default(0),
  denomination: z.string().nullable().optional(),
  web_photo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  surname: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  public_agenda: z.boolean().optional().default(false),
  social_networks: z.array(externalOrganigramaMemberSocialSchema).nullable().optional().default([]),
})

export const externalOrganigramaAreaSchema = z.object({
  area_id: z.coerce.number().int(),
  area_name: z.string(),
  area_name_translations: z.record(z.string(), z.string()).optional().default({}),
  area_order: z.coerce.number().int(),
  members: z.array(externalOrganigramaMemberSchema),
})

export const externalOrganigramaResponseSchema = z.object({
  data: z.array(externalOrganigramaAreaSchema),
  generated_at: z.string().nullable().optional(),
})

// External organigrama mandates (mandate list) API schemas
export const externalMandateSchema = z.object({
  id: z.coerce.number().int(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  is_current: z.boolean(),
})

export const externalMandatesResponseSchema = z.object({
  data: z.array(externalMandateSchema),
  generated_at: z.string().nullable().optional(),
})

// External organigrama mandate detail API schemas
export const externalMandateAssignmentMemberSchema = z.object({
  order: z.coerce.number().int().default(0),
  denomination: z.string().nullable().optional(),
  web_photo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  surname: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  social_networks: z.array(externalOrganigramaMemberSocialSchema).nullable().optional().default([]),
})

export const externalMandateAssignmentSchema = z.object({
  id: z.coerce.number().int(),
  role: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  start_date: z.string(),
  end_date: z.string().nullable(),
  member: externalMandateAssignmentMemberSchema,
})

export const externalMandateAreaTermSchema = z.object({
  area_term_id: z.coerce.number().int(),
  area_id: z.coerce.number().int(),
  area_name: z.string(),
  area_name_translations: z.record(z.string(), z.string()).optional().default({}),
  area_order: z.coerce.number().int(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  assignments: z.array(externalMandateAssignmentSchema),
})

export const externalMandateDetailResponseSchema = z.object({
  mandate: externalMandateSchema,
  data: z.array(externalMandateAreaTermSchema),
  generated_at: z.string().nullable().optional(),
})

// External committees API schemas
export const externalCommitteeMemberSocialSchema = externalSocialNetworkSchema

export const externalCommitteeMemberSchema = z.object({
  order: z.coerce.number().int().default(0),
  denomination: z.string().nullable().optional(),
  web_photo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  surname: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  social_networks: z.array(externalCommitteeMemberSocialSchema).nullable().optional().default([]),
  public_agenda: z.boolean().optional().default(false),
})

export const externalCommitteeSchema = z.object({
  committee_id: z.coerce.number().int(),
  committee_name: z.string(),
  committee_name_translations: z.record(z.string(), z.string()).optional().default({}),
  committee_description: z.string().nullable().optional(),
  committee_description_translations: z.record(z.string(), z.string()).optional().default({}),
  committee_order: z.coerce.number().int(),
  members: z.array(externalCommitteeMemberSchema),
})

export const externalCommitteesResponseSchema = z.object({
  data: z.array(externalCommitteeSchema),
  generated_at: z.string().nullable().optional(),
})

// External events API schemas
export const externalEventBannerSchema = z.object({
  url: z.string().nullable().optional(),
})

export const externalEventDocumentSchema = z.object({
  order: z.coerce.number().int().default(0),
  title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
})

export const externalEventOrganizationSchema = z.object({
  order: z.coerce.number().int().default(0),
  name: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  web_logo_light: z.string().nullable().optional(),
})

export const externalEventGalleryImageSchema = z.object({
  order: z.coerce.number().int().default(0),
  url: z.string().nullable().optional(),
})

export const externalEventSchema = z.object({
  event_id: z.coerce.number().int(),
  event_name: z.string(),
  event_slug: z.string(),
  event_type: z.string().nullable().optional(),
  event_location: z.string().nullable().optional(),
  event_description: z.string().nullable().optional(),
  event_banner: externalEventBannerSchema.nullable().optional(),
  event_start_date: z.string(),
  event_end_date: z.string().nullable().optional(),
  documents: z.array(externalEventDocumentSchema).nullable().optional().default([]),
  organizers: z.array(externalEventOrganizationSchema).nullable().optional().default([]),
  venues: z.array(externalEventOrganizationSchema).nullable().optional().default([]),
  collaborators: z.array(externalEventOrganizationSchema).nullable().optional().default([]),
  gallery_images: z.array(externalEventGalleryImageSchema).nullable().optional().default([]),
  order: z.coerce.number().int().default(0),
})

export const externalEventsResponseSchema = z.object({
  data: z.array(externalEventSchema),
  generated_at: z.string().nullable().optional(),
})

// External policy document API schemas (posicionamientos, resoluciones, informes ejecutivos)
export const externalPolicyDocumentFileSchema = z.object({
  name: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
})

export const externalPolicyDocumentSchema = z.object({
  order: z.coerce.number().int().default(0),
  name: z.string(),
  date: z.string(),
  assembly: z.string().nullable().optional(),
  file: externalPolicyDocumentFileSchema.nullable().optional(),
})

export const externalPolicyDocumentsResponseSchema = z.object({
  data: z.array(externalPolicyDocumentSchema),
  generated_at: z.string().nullable().optional(),
})

export const policyDocumentRouteTypeSchema = z.enum([
  'posicionamiento',
  'resolucion',
  'informe-ejecutivo',
])

// External normativa (regulations) API schemas
export const externalNormativaDocumentSchema = z.object({
  order: z.coerce.number().int().default(0),
  name: z.string(),
  date: z.string(),
  assembly: z.string().nullable().optional(),
  file: externalPolicyDocumentFileSchema.nullable().optional(),
})

export const externalNormativaCategorySchema = z.object({
  category: z.string(),
  documents: z.array(externalNormativaDocumentSchema),
})

export const externalNormativaResponseSchema = z.object({
  data: z.array(externalNormativaCategorySchema),
  generated_at: z.string().nullable().optional(),
})

export const policyDocumentFileNameParamSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[A-Za-z0-9%._-]+$/),
})

export const policyDocumentTypeRouteParamSchema = z.object({
  type: policyDocumentRouteTypeSchema,
})

// Media Outlet schemas
export const createMediaOutletSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  website: z.string().url('La URL no es válida'),
  logo: z.string().min(1, 'El logo es requerido'),
  order: z.number().int().min(0).default(0),
})

export const updateMediaOutletSchema = createMediaOutletSchema

// About page schemas
export const updateAboutPageContentSchema = z.object({
  heroImage: z.string().min(1, 'La imagen es requerida').nullable(),
  heroVisible: z.boolean().default(false),
})

// Equality Document schemas
export const equalityDocumentTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  description: z.string(),
  meta: z.string().optional().nullable(),
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
    const requiredTranslation = getRequiredTranslation(data.translations)

    if (!requiredTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }

    if (!requiredTranslation?.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La descripción en español es obligatoria',
        path: ['translations'],
      })
    }
  })

export const updateEqualityDocumentSchema = createEqualityDocumentSchema

// Financial Report schemas
export const financialReportTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(),
})

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
    const requiredTranslation = getRequiredTranslation(data.translations)

    if (!requiredTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }
  })

export const updateFinancialReportSchema = createFinancialReportSchema

export const updatePressDossierSchema = z.object({
  pdfUrl: z.string().min(1, 'El PDF es requerido').nullable(),
  active: z.boolean().default(false),
})

export const createNewsletterSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'El mes no es válido'),
  coverImage: z.string().min(1, 'La imagen de portada es requerida'),
  pdfUrl: z.string().min(1, 'El PDF es requerido'),
  active: z.boolean().default(true),
})

export const updateNewsletterSchema = createNewsletterSchema

export const updateSubscriberSchema = z.object({
  email: z.string().email('El email no es válido'),
  active: z.boolean(),
})

export const createAdminAccessSchema = z.object({
  email: z
    .string()
    .trim()
    .email('El correo no es válido')
    .transform((email) => email.toLowerCase()),
})

export const updateAdminAccessSchema = z.object({
  active: z.boolean(),
})

export const newsletterSubscribeSchema = z
  .object({
    email: z.string().email().max(254),
    consent: z.boolean(),
    ageConfirmed: z.boolean(),
    website: z.string().max(256).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.consent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes aceptar la política de privacidad',
        path: ['consent'],
      })
    }

    if (!data.ageConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes confirmar que tienes al menos 14 años o autorización legal',
        path: ['ageConfirmed'],
      })
    }
  })

export const contactFormSchema = z
  .object({
    contactType: z.enum(['general', 'press']).default('general'),
    name: z.string().min(CONTACT_FIELD_LIMITS.name.min).max(CONTACT_FIELD_LIMITS.name.max),
    email: z.string().email().max(CONTACT_FIELD_LIMITS.emailMax),
    phone: z.string().max(CONTACT_FIELD_LIMITS.phoneMax).optional(),
    mediaName: z.string().max(CONTACT_FIELD_LIMITS.mediaNameMax).optional(),
    subject: z.string().min(CONTACT_FIELD_LIMITS.subject.min).max(CONTACT_FIELD_LIMITS.subject.max),
    message: z.string().min(CONTACT_FIELD_LIMITS.message.min).max(CONTACT_FIELD_LIMITS.message.max),
    website: z.string().max(256).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidOptionalContactPhone(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El teléfono no es válido',
        path: ['phone'],
      })
    }

    if (data.contactType === 'press') {
      if (!data.mediaName || data.mediaName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre del medio es obligatorio para contacto de prensa',
          path: ['mediaName'],
        })
      }
    }
  })

export const adminUploadKindSchema = z.object({
  kind: z.enum(['carousel', 'featured_link']),
})

const multipartFileSchema = z.object({
  data: z.instanceof(Uint8Array),
  filename: z.string().trim().min(1),
})

function formatValidationError(error: z.ZodError) {
  return error.issues
    .map((issue: z.core.$ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ')
}

function validateSchema<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: formatValidationError(result.error),
    })
  }

  return result.data
}

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return validateSchema(schema, input)
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return validateInput(schema, body)
}

export function validateQuery<T>(event: H3Event, schema: z.ZodSchema<T>): T {
  return validateInput(schema, getQuery(event))
}

export function validateRouteParams<T extends z.ZodRawShape>(
  event: H3Event,
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  const params = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, getRouterParam(event, key)])
  )

  return validateInput(schema, params)
}

export function validateMultipartFile(
  formData: MultiPartData[] | undefined,
  fieldName = 'file'
): z.infer<typeof multipartFileSchema> {
  if (!formData?.length) {
    throw createError({ statusCode: 400, message: 'No se ha enviado ningún archivo' })
  }

  const file = formData.find((entry) => entry.name === fieldName)
  if (!file) {
    throw createError({ statusCode: 400, message: 'Archivo no válido' })
  }

  const parsedFile = multipartFileSchema.safeParse({
    data: file.data,
    filename: file.filename,
  })

  if (!parsedFile.success) {
    throw createError({ statusCode: 400, message: 'Archivo no válido' })
  }

  return parsedFile.data
}

export function getMultipartTextField(
  formData: MultiPartData[] | undefined,
  fieldName: string
): string | undefined {
  const field = formData?.find((entry) => entry.name === fieldName)
  const value = field?.data?.toString('utf8').trim()

  return value ? value : undefined
}
