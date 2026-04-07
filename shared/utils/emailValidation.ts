export const EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(value?: string | null) {
  const normalizedValue = String(value ?? '').trim()

  return (
    normalizedValue.length > 0 &&
    normalizedValue.length <= EMAIL_MAX_LENGTH &&
    EMAIL_PATTERN.test(normalizedValue)
  )
}
