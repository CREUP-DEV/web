import { z } from 'zod'

import { EMAIL_MAX_LENGTH } from './emailValidation'

export const CONTACT_FIELD_LIMITS = {
  name: {
    min: 2,
    max: 100,
  },
  emailMax: EMAIL_MAX_LENGTH,
  phoneMax: 30,
  mediaNameMax: 200,
  subject: {
    min: 3,
    max: 200,
  },
  message: {
    min: 10,
    max: 5000,
  },
  honeypotMax: 256,
  turnstileTokenMax: 2048,
} as const

export const CONTACT_PHONE_PATTERN = /^[+\d][\d\s()-]{5,29}$/

export function isValidOptionalContactPhone(value?: string | null) {
  const normalizedValue = String(value ?? '').trim()
  return normalizedValue.length === 0 || CONTACT_PHONE_PATTERN.test(normalizedValue)
}

export const contactFormSchema = z
  .object({
    contactType: z.enum(['general', 'press']).default('general'),
    name: z.string().trim().min(CONTACT_FIELD_LIMITS.name.min).max(CONTACT_FIELD_LIMITS.name.max),
    email: z.string().trim().email().max(Math.min(CONTACT_FIELD_LIMITS.emailMax, EMAIL_MAX_LENGTH)),
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
