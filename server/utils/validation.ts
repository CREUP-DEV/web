/**
 * Zod validation schemas for admin API endpoints
 * Note: Locale is validated as a string (not enum) to support dynamic languages
 * Spanish (es) is required, other locales are optional
 */
import { z } from 'zod'

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

// News Item schemas
export const newsTranslationSchema = z.object({
  locale: localeSchema,
  title: z.string(), // Not required for non-Spanish locales
  alt: z.string().optional(),
})

export const createNewsItemSchema = z.object({
  image: z.string().min(1, 'La imagen es requerida'),
  to: z.string().min(1, 'El enlace es requerido'),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  tagIds: z.array(z.string()).optional().default([]),
  publishedAt: z.string().datetime().optional(),
  translations: z.array(newsTranslationSchema).min(1, 'Se requiere al menos una traducción'),
})

export const updateNewsItemSchema = createNewsItemSchema.partial().extend({
  translations: z.array(newsTranslationSchema).min(1),
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

export const membersLogoQuerySchema = z.object({
  src: z.string().trim().min(1),
})

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

// Contact form schema (public endpoint)
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  website: z.string().optional(), // Honeypot field — should always be empty
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
