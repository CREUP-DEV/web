import { createError } from 'h3'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { adminAccess, sessions, users } from '../db/schema'

export interface AdminAccessListItem {
  id: string
  databaseId: string | null
  email: string
  name: string | null
  image: string | null
  active: boolean
  protectedByEnv: boolean
  source: 'env' | 'database' | 'both'
  lastAccessAt: Date | null
  createdAt: Date | null
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeAdminEmailDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^@+/, '')
}

export function getAllowedAdminEmailDomain() {
  const domain = normalizeAdminEmailDomain(process.env.ADMIN_EMAIL_DOMAIN ?? '')
  return domain || null
}

export function isAdminEmailFromAllowedDomain(email: string) {
  const allowedDomain = getAllowedAdminEmailDomain()
  if (!allowedDomain) {
    return true
  }

  const normalizedEmail = normalizeAdminEmail(email)
  const [, emailDomain = ''] = normalizedEmail.split('@')
  return emailDomain === allowedDomain
}

export function getEnvAdminEmails() {
  return Array.from(
    new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(/[\s,;]+/)
        .map((email) => normalizeAdminEmail(email))
        .filter(Boolean)
    )
  )
}

export function isEnvAdminEmail(email: string) {
  return getEnvAdminEmails().includes(normalizeAdminEmail(email))
}

export async function isAdminEmailAuthorized(email: string) {
  const normalizedEmail = normalizeAdminEmail(email)

  if (!normalizedEmail || !isAdminEmailFromAllowedDomain(normalizedEmail)) {
    return false
  }

  if (isEnvAdminEmail(normalizedEmail)) {
    return true
  }

  const [authorizedEmail] = await db
    .select({ id: adminAccess.id })
    .from(adminAccess)
    .where(and(eq(adminAccess.email, normalizedEmail), eq(adminAccess.active, true)))
    .limit(1)

  return Boolean(authorizedEmail)
}

export async function getAdminAccessById(id: string) {
  const [entry] = await db.select().from(adminAccess).where(eq(adminAccess.id, id)).limit(1)
  return entry ?? null
}

export async function countEffectiveActiveAdmins() {
  const envEmails = getEnvAdminEmails().filter((email) => isAdminEmailFromAllowedDomain(email))
  const dbAdmins = await db
    .select({ email: adminAccess.email })
    .from(adminAccess)
    .where(eq(adminAccess.active, true))

  return new Set([
    ...envEmails,
    ...dbAdmins
      .map((entry) => normalizeAdminEmail(entry.email))
      .filter((email) => isAdminEmailFromAllowedDomain(email)),
  ]).size
}

export async function assertAdminAccessCanBeRevoked(entry: { email: string; active: boolean }) {
  const normalizedEmail = normalizeAdminEmail(entry.email)

  if (isEnvAdminEmail(normalizedEmail)) {
    throw createError({
      statusCode: 400,
      message: 'No puedes modificar un acceso definido en el archivo de entorno.',
    })
  }

  if (!entry.active) {
    return
  }

  const activeAdminCount = await countEffectiveActiveAdmins()
  if (activeAdminCount <= 1) {
    throw createError({
      statusCode: 400,
      message: 'No puedes dejar el panel sin administradores activos.',
    })
  }
}

export async function listAdminAccess() {
  const envEmails = getEnvAdminEmails()
  const dbEntries = await db.select().from(adminAccess).orderBy(desc(adminAccess.createdAt))
  const allEmails = Array.from(
    new Set([...envEmails, ...dbEntries.map((entry) => normalizeAdminEmail(entry.email))])
  )

  const userRows = allEmails.length
    ? await db.select().from(users).where(inArray(users.email, allEmails))
    : []

  const sessionRows = userRows.length
    ? await db
        .select({
          userId: sessions.userId,
          lastAccessAt: sql<Date | null>`max(${sessions.updatedAt})`,
        })
        .from(sessions)
        .where(
          inArray(
            sessions.userId,
            userRows.map((user) => user.id)
          )
        )
        .groupBy(sessions.userId)
    : []

  const userByEmail = new Map(userRows.map((user) => [normalizeAdminEmail(user.email), user]))
  const lastAccessByUserId = new Map(
    sessionRows.map((session) => [session.userId, session.lastAccessAt])
  )
  const dbEntryByEmail = new Map(
    dbEntries.map((entry) => [normalizeAdminEmail(entry.email), entry])
  )

  const items: AdminAccessListItem[] = allEmails
    .map((email) => {
      const dbEntry = dbEntryByEmail.get(email) ?? null
      const user = userByEmail.get(email) ?? null
      const protectedByEnv = envEmails.includes(email)

      return {
        id: dbEntry?.id ?? `env:${email}`,
        databaseId: dbEntry?.id ?? null,
        email,
        name: user?.name ?? null,
        image: user?.image ?? null,
        active:
          isAdminEmailFromAllowedDomain(email) && (protectedByEnv || dbEntry?.active === true),
        protectedByEnv,
        source: protectedByEnv && dbEntry ? 'both' : protectedByEnv ? 'env' : 'database',
        lastAccessAt: user ? (lastAccessByUserId.get(user.id) ?? null) : null,
        createdAt: dbEntry?.createdAt ?? null,
      }
    })
    .sort((left, right) => {
      if (left.protectedByEnv !== right.protectedByEnv) {
        return left.protectedByEnv ? -1 : 1
      }

      const rightLastAccess = right.lastAccessAt?.getTime() ?? 0
      const leftLastAccess = left.lastAccessAt?.getTime() ?? 0
      if (leftLastAccess !== rightLastAccess) {
        return rightLastAccess - leftLastAccess
      }

      return left.email.localeCompare(right.email, 'es')
    })

  return {
    items,
    summary: {
      total: items.length,
      active: items.filter((item) => item.active).length,
      env: items.filter((item) => item.protectedByEnv).length,
    },
  }
}
