/**
 * The props `<ObfuscatedEmail>` takes for `email`: both halves base64-encoded, so the address only
 * appears in the page once the component mounts.
 */
export function encodeObfuscatedEmail(email: string) {
  const [user = '', domain = ''] = email.split('@')
  return { eu: btoa(user), ed: btoa(domain) }
}
