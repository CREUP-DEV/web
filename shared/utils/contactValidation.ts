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
} as const

export const CONTACT_PHONE_PATTERN = /^[+\d][\d\s()-]{5,29}$/

export function isValidOptionalContactPhone(value?: string | null) {
  const normalizedValue = String(value ?? '').trim()
  return normalizedValue.length === 0 || CONTACT_PHONE_PATTERN.test(normalizedValue)
}
