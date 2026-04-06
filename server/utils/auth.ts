import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getOptionalConfigUrl, requireConfigString } from '~~/shared/utils/config'
import { db } from '../db'
import { users, sessions, accounts, verifications } from '../db/schema'
import { isAdminEmailAuthorized, normalizeAdminEmail } from './adminAccess'

interface SignInUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

function getTrustedOrigins() {
  return Array.from(
    new Set(
      [
        getOptionalConfigUrl(process.env.BETTER_AUTH_URL, 'BETTER_AUTH_URL'),
        getOptionalConfigUrl(process.env.SITE_URL, 'SITE_URL'),
      ].filter((origin): origin is string => Boolean(origin))
    )
  )
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: requireConfigString(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireConfigString(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  callbacks: {
    async signIn({ user }: { user: SignInUser }) {
      const normalizedEmail = user.email ? normalizeAdminEmail(user.email) : ''

      if (!normalizedEmail || !(await isAdminEmailAuthorized(normalizedEmail))) {
        return {
          error: 'Acceso no autorizado. Solo los administradores pueden acceder.',
        }
      }
      return { success: true }
    },
  },
  trustedOrigins: getTrustedOrigins(),
})

export type Session = typeof auth.$Infer.Session
