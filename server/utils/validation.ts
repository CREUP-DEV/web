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
