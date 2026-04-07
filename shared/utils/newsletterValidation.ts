import { EMAIL_MAX_LENGTH, isValidEmailAddress } from './emailValidation'

export const NEWSLETTER_FIELD_LIMITS = {
  emailMax: EMAIL_MAX_LENGTH,
  websiteMax: 256,
} as const

export function isValidNewsletterEmail(value?: string | null) {
  return isValidEmailAddress(value)
}
