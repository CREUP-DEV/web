import { z } from 'zod'

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
  src: z.string().trim().min(1).max(2048),
})

export const externalAssetPublicPathParamSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((value: string) => {
      try {
        const decoded = decodeURIComponent(value)
        return (
          /^[\p{L}\p{N} /:._-]+$/u.test(decoded) &&
          !decoded.includes('..') &&
          !decoded.includes('\\')
        )
      } catch {
        return false
      }
    }, 'La ruta contiene caracteres no permitidos'),
})

export const membersLogoQuerySchema = externalAssetQuerySchema

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
  is_committee_responsible: z.boolean().optional().default(false),
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
  is_committee_responsible: z.boolean().optional().default(false),
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
  web_logo_dark: z.string().nullable().optional(),
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
  'normativa',
])

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
    .regex(/^[A-Za-z0-9._-]+$/),
})

export const policyDocumentTypeRouteParamSchema = z.object({
  type: policyDocumentRouteTypeSchema,
})
