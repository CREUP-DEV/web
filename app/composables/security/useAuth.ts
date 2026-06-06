import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient()

export const useAuth = () => {
  const session = authClient.useSession()
  const localePath = useLocalePath()

  const signInWithGoogle = async () => {
    // Localized so the OAuth round-trip returns to the active-locale panel (e.g. /en/admin),
    // not the default-locale one.
    return authClient.signIn.social({
      provider: 'google',
      callbackURL: localePath('/admin'),
      errorCallbackURL: localePath('/admin/login'),
    })
  }

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigateTo(localePath('/'))
        },
      },
    })
  }

  return {
    session,
    signInWithGoogle,
    signOut,
  }
}
