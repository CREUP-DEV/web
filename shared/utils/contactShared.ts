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

/** The mailboxes the contact page and the press kit give: press, and everything else. */
export const PRESS_CONTACT_EMAIL = 'prensa@creup.es'
export const GENERAL_CONTACT_EMAIL = 'info@creup.es'

/** `/contacto?tipo=prensa` opens the contact form on the press contact type. */
export const CONTACT_TYPE_QUERY_KEY = 'tipo'
export const PRESS_CONTACT_TYPE_QUERY_VALUE = 'prensa'

export const CONTACT_PHONE_PATTERN = /^[+\d][\d\s()-]{5,29}$/

export function isValidOptionalContactPhone(value?: string | null) {
  const normalizedValue = String(value ?? '').trim()
  return normalizedValue.length === 0 || CONTACT_PHONE_PATTERN.test(normalizedValue)
}
