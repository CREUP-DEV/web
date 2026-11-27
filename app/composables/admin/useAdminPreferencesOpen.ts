/** Whether the admin «Preferencias» dialog is open; the account menu opens it, the layout holds it. */
export function useAdminPreferencesOpen() {
  return useState<boolean>('admin-preferences-open', () => false)
}
