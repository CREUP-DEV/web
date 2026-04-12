import { z } from 'zod'

import { CONTACT_FIELD_LIMITS, isValidOptionalContactPhone } from './contactShared'

export const contactFormSchema = z
  .object({
    contactType: z.enum(['general', 'press']).default('general'),
    name: z.string().trim().min(CONTACT_FIELD_LIMITS.name.min).max(CONTACT_FIELD_LIMITS.name.max),
    email: z.string().trim().email().max(CONTACT_FIELD_LIMITS.emailMax),
    phone: z.string().trim().max(CONTACT_FIELD_LIMITS.phoneMax).optional(),
    mediaName: z.string().trim().max(CONTACT_FIELD_LIMITS.mediaNameMax).optional(),
    subject: z
      .string()
      .trim()
      .min(CONTACT_FIELD_LIMITS.subject.min)
      .max(CONTACT_FIELD_LIMITS.subject.max),
    message: z
      .string()
      .trim()
      .min(CONTACT_FIELD_LIMITS.message.min)
      .max(CONTACT_FIELD_LIMITS.message.max),
    middleName: z.string().trim().max(CONTACT_FIELD_LIMITS.honeypotMax).optional(),
    startedAt: z.coerce.number().int().positive(),
    turnstileToken: z.string().trim().max(CONTACT_FIELD_LIMITS.turnstileTokenMax).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidOptionalContactPhone(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El teléfono no es válido',
        path: ['phone'],
      })
    }

    if (data.contactType === 'press' && !data.mediaName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre del medio es obligatorio para contacto de prensa',
        path: ['mediaName'],
      })
    }
  })
