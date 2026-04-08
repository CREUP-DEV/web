import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient()

// Call useSession once at module level so all useAuth() callers share the same
// reactive subscription instead of creating a new one per call.
const _session = authClient.useSession()

export const useAuth = () => {
  const signInWithGoogle = async () => {
    return authClient.signIn.social({
      provider: 'google',
      callbackURL: '/admin',
    })
  }

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigateTo('/')
        },
      },
    })
  }

  return {
    session: _session,
    signInWithGoogle,
    signOut,
  }
}
