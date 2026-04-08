import { z } from 'zod'

import { EMAIL_MAX_LENGTH, isValidEmailAddress } from './emailValidation'

export const NEWSLETTER_FIELD_LIMITS = {
  emailMax: EMAIL_MAX_LENGTH,
  websiteMax: 256,
} as const

export function isValidNewsletterEmail(value?: string | null) {
  return isValidEmailAddress(value)
}

export const newsletterSubscribeSchema = z
  .object({
    email: z.string().trim().email().max(NEWSLETTER_FIELD_LIMITS.emailMax),
    consent: z.boolean(),
    ageConfirmed: z.boolean(),
    website: z.string().trim().max(NEWSLETTER_FIELD_LIMITS.websiteMax).optional(),
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
