import { z } from 'zod'

import { EMAIL_MAX_LENGTH } from './emailValidation'

export const NEWSLETTER_FIELD_LIMITS = {
  emailMax: EMAIL_MAX_LENGTH,
  honeypotMax: 256,
  turnstileTokenMax: 2048,
} as const

export function isValidNewsletterEmail(value?: string | null) {
  return z.string().trim().email().max(NEWSLETTER_FIELD_LIMITS.emailMax).safeParse(value).success
}

export const newsletterSubscribeSchema = z
  .object({
    email: z.string().trim().email().max(NEWSLETTER_FIELD_LIMITS.emailMax),
    consent: z.boolean(),
    middleName: z.string().trim().max(NEWSLETTER_FIELD_LIMITS.honeypotMax).optional(),
    startedAt: z.coerce.number().int().positive(),
    turnstileToken: z.string().trim().max(NEWSLETTER_FIELD_LIMITS.turnstileTokenMax).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.consent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes aceptar la política de privacidad',
        path: ['consent'],
      })
    }
  })
