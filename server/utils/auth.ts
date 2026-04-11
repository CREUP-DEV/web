import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
  getOptionalConfigString,
  getOptionalConfigUrl,
  requireConfigString,
} from '~~/shared/utils/config'
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
  secret: requireConfigString(
    getOptionalConfigString(process.env.BETTER_AUTH_SECRET) ??
      getOptionalConfigString(process.env.APP_SECRET),
    'BETTER_AUTH_SECRET or APP_SECRET'
  ),
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
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': {
        window: 60,
        max: 10,
      },
      '/sign-in/social': {
        window: 60,
        max: 20,
      },
      '/callback/*': {
        window: 60,
        max: 20,
      },
    },
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
  advanced: {
    // Explicitly declare cookie attributes — SameSite=Lax + Secure in production is the
    // baseline defense against CSRF without breaking redirect-based OAuth flows.
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        },
      },
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
