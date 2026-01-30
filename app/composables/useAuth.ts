import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
})

export const useAuth = () => {
  const session = authClient.useSession()

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
    session,
    signInWithGoogle,
    signOut,
  }
}
