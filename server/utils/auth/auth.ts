import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { getOptionalConfigUrl, requireConfigString } from '~~/shared/utils/config'
import { db } from '../../db'
import { users, sessions, accounts, verifications } from '../../db/schema'
import { isAdminEmailAuthorized, normalizeAdminEmail } from '../admin/adminAccess'
import { buildRedisKey, getRedisClient } from '../cache/redis'

function getAuthBaseUrl() {
  return (
    getOptionalConfigUrl(process.env.BETTER_AUTH_URL, 'BETTER_AUTH_URL') ||
    getOptionalConfigUrl(process.env.NUXT_SITE_URL, 'NUXT_SITE_URL') ||
    getOptionalConfigUrl(process.env.SITE_URL, 'SITE_URL') ||
    undefined
  )
}

function getTrustedOrigins(): string[] {
  const origin = getAuthBaseUrl()
  if (!origin) {
    throw new Error(
      'No base URL configured for better-auth trustedOrigins. Set BETTER_AUTH_URL, NUXT_SITE_URL, or SITE_URL.'
    )
  }
  return [origin]
}

const authSecondaryStorage = {
  delete: async (key: string) => {
    await getRedisClient().del(buildRedisKey('better-auth', key))
  },
  get: async (key: string) => {
    return getRedisClient().get(buildRedisKey('better-auth', key))
  },
  set: async (key: string, value: string, ttl?: number) => {
    const redis = getRedisClient()
    const storageKey = buildRedisKey('better-auth', key)

    if (ttl && ttl > 0) {
      await redis.set(storageKey, value, 'EX', ttl)
      return
    }

    await redis.set(storageKey, value)
  },
}

async function assertAdminEmailCanAuthenticate(email: string | null | undefined) {
  const normalizedEmail = email ? normalizeAdminEmail(email) : ''
  if (!normalizedEmail || !(await isAdminEmailAuthorized(normalizedEmail))) {
    throw new APIError('FORBIDDEN', { message: 'Acceso no autorizado.' })
  }
}

export const auth = betterAuth({
  baseURL: getAuthBaseUrl(),
  secret: requireConfigString(process.env.APP_SECRET, 'APP_SECRET'),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  account: {
    // Better Auth native token protection (AES-256-GCM) for OAuth provider tokens.
    encryptOAuthTokens: true,
  },
  emailAndPassword: {
    enabled: false,
  },
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
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
  onAPIError: {
    errorURL: '/admin/login',
  },
  secondaryStorage: authSecondaryStorage,
  socialProviders: {
    google: {
      clientId: requireConfigString(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireConfigString(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET'),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    cookies: {
      session_token: {
        name: process.env.NODE_ENV === 'production' ? '__Host-admin-session' : 'admin-session',
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          path: '/',
        },
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          await assertAdminEmailCanAuthenticate(user.email)
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          const [userRow] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, account.userId))
            .limit(1)

          await assertAdminEmailCanAuthenticate(userRow?.email)
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [userRow] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1)

          await assertAdminEmailCanAuthenticate(userRow?.email)
        },
      },
    },
  },
  trustedOrigins: getTrustedOrigins(),
})

export type Session = typeof auth.$Infer.Session
