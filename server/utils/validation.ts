/**
 * Zod validation schemas for admin API endpoints
 * Note: Locale is validated as a string (not enum) to support dynamic languages
 * Spanish (es) is required, other locales are optional
 */
import { z } from 'zod'
import { hasMeaningfulRichTextHtml } from './pressTranslation'

// Locale is a non-empty string to support dynamic languages
const localeSchema = z.string().min(1, 'El locale es requerido')

// Carousel Item schemas
export const carouselTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(), // Not required for non-Spanish locales
  buttonText: z.string().optional(),
  alt: z.string().optional(),
})

export const createCarouselItemSchema = z.object({
  image: z.string().min(1, 'La imagen es requerida'),
  href: z.string().min(1, 'El enlace es requerido'),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  translations: z.array(carouselTranslationSchema).min(1, 'Se requiere al menos una traducción'),
})

export const updateCarouselItemSchema = createCarouselItemSchema.partial().extend({
  translations: z.array(carouselTranslationSchema).min(1),
})

// Press Article schemas
export const pressArticleTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(), // Not required for non-Spanish locales
  description: z.string().optional(),
  contentHtml: z.string().optional().nullable(),
  alt: z.string().optional(),
})

export const pressArticleTypeSchema = z.enum(['press_release', 'statement', 'media_appearance'])

export const createPressArticleSchema = z
  .object({
    type: pressArticleTypeSchema,
    image: z.string().min(1, 'La imagen es requerida'),
    pdfUrl: z.string().optional().nullable(),
    externalUrl: z.string().url('La URL externa no es válida').optional().nullable(),
    mediaOutletId: z.string().optional().nullable(),
    active: z.boolean().default(true),
    tagIds: z.array(z.string()).optional().default([]),
    publishedAt: z.string().datetime().optional(),
    translations: z
      .array(pressArticleTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    const esTranslation = data.translations.find((translation) => translation.locale === 'es')

    if (!esTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }
    if (
      (data.type === 'press_release' || data.type === 'statement') &&
      !data.pdfUrl &&
      !hasMeaningfulRichTextHtml(esTranslation?.contentHtml)
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
  })

export const updatePressArticleSchema = z
  .object({
    type: pressArticleTypeSchema,
    image: z.string().min(1, 'La imagen es requerida'),
    pdfUrl: z.string().optional().nullable(),
    externalUrl: z.string().url('La URL externa no es válida').optional().nullable(),
    mediaOutletId: z.string().optional().nullable(),
    active: z.boolean().default(true),
    tagIds: z.array(z.string()).optional().default([]),
    publishedAt: z.string().datetime().optional(),
    translations: z
      .array(pressArticleTranslationSchema)
      .min(1, 'Se requiere al menos una traducción'),
  })
  .superRefine((data, ctx) => {
    const esTranslation = data.translations.find((translation) => translation.locale === 'es')

    if (!esTranslation?.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El título en español es obligatorio',
        path: ['translations'],
      })
    }
    if (
      (data.type === 'press_release' || data.type === 'statement') &&
      !data.pdfUrl &&
      !hasMeaningfulRichTextHtml(esTranslation?.contentHtml)
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
  })

// Featured Link schemas
export const featuredLinkTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(), // Not required for non-Spanish locales
  alt: z.string().optional(),
})

export const createFeaturedLinkSchema = z.object({
  image: z.string().min(1, 'La imagen es requerida'),
  to: z.string().min(1, 'El enlace es requerido'),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  translations: z
    .array(featuredLinkTranslationSchema)
    .min(1, 'Se requiere al menos una traducción'),
})

export const updateFeaturedLinkSchema = createFeaturedLinkSchema.partial().extend({
  translations: z.array(featuredLinkTranslationSchema).min(1),
})

// Tag schemas
export const tagTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string(), // Not required for non-Spanish locales
})

export const createTagSchema = z.object({
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  order: z.number().int().min(0).default(0),
  translations: z.array(tagTranslationSchema).min(1, 'Se requiere al menos una traducción'),
})

export const updateTagSchema = createTagSchema.partial().extend({
  translations: z.array(tagTranslationSchema).min(1),
})

// Bulk order update schema
export const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
})

// External members API schemas
export const externalAssociatedMemberSocialSchema = z.object({
  network: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
})

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

export const externalAssetQuerySchema = z.object({
  src: z.string().trim().min(1),
})

export const externalAssetPublicPathParamSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .regex(/^[A-Za-z0-9%/:._-]+$/),
})

export const membersLogoQuerySchema = externalAssetQuerySchema

// External sectorial members API schemas
export const externalSectorialMemberSocialSchema = z.object({
  network: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
})

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
export const externalOrganigramaMemberSocialSchema = z.object({
  network: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
})

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
export const externalCommitteeMemberSocialSchema = z.object({
  network: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
})

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

// Media Outlet schemas
export const createMediaOutletSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  website: z.string().url('La URL no es válida'),
  logo: z.string().min(1, 'El logo es requerido'),
  order: z.number().int().min(0).default(0),
})

export const updateMediaOutletSchema = createMediaOutletSchema

// Newsletter schemas
export const createNewsletterSchema = z.object({
  /** ISO date string for the first day of the month this newsletter covers */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, 'El mes no es válido'),
  coverImage: z.string().min(1, 'La imagen de portada es requerida'),
  pdfUrl: z.string().min(1, 'El PDF es requerido'),
  active: z.boolean().default(true),
})

export const updateNewsletterSchema = createNewsletterSchema

// Newsletter subscriber schemas (admin)
export const updateSubscriberSchema = z.object({
  email: z.string().email('El email no es válido'),
  active: z.boolean(),
})

// Admin access schemas
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

// Newsletter subscription schema (public endpoint)
export const newsletterSubscribeSchema = z
  .object({
    email: z.string().email().max(254),
    consent: z.boolean(),
    ageConfirmed: z.boolean(),
    website: z.string().optional(), // Honeypot
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

// Contact form schema (public endpoint)
export const contactFormSchema = z
  .object({
    contactType: z.enum(['general', 'press']).default('general'),
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().max(30).optional(), // Required for press, optional otherwise
    mediaName: z.string().max(200).optional(), // Required for press
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
    website: z.string().optional(), // Honeypot field — should always be empty
  })
  .superRefine((data, ctx) => {
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

// Helper function to validate and parse body
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues
      .map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    throw new Error(`Validation error: ${errors}`)
  }
  return result.data
}
