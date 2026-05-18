import { z } from 'zod'

export const updateAboutPageContentSchema = z.object({
  heroImage: z.string().min(1, 'La imagen es requerida').nullable(),
  heroVisible: z.boolean().default(false),
  updatedAt: z.string().datetime().optional(),
})

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
