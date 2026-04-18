import { createError } from 'h3'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { accounts, adminAccess, sessions, users } from '../db/schema'

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

function normalizeTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase()
}

let cachedEnvAdminEmails: string[] | null = null

export function getEnvAdminEmails() {
  if (cachedEnvAdminEmails !== null) {
    return cachedEnvAdminEmails
  }

  const rawEmails = process.env.ADMIN_EMAILS

  if (rawEmails === undefined) {
    cachedEnvAdminEmails = []
    return cachedEnvAdminEmails
  }

  cachedEnvAdminEmails = Array.from(
    new Set(
      rawEmails
        .split(/[,\s]+/)
        .map((email) => normalizeAdminEmail(email))
        .filter(Boolean)
    )
  )

  return cachedEnvAdminEmails
}

export function isEnvAdminEmail(email: string) {
  return getEnvAdminEmails().includes(normalizeAdminEmail(email))
}

export async function isAdminEmailAuthorized(email: string) {
  const normalizedEmail = normalizeAdminEmail(email)

  if (!normalizedEmail) {
    return false
  }

  // Env-configured emails are always authoritative
  if (isEnvAdminEmail(normalizedEmail)) {
    return true
  }

  // Otherwise check the database
  const [authorizedEmail] = await db
    .select({ id: adminAccess.id })
    .from(adminAccess)
    .where(and(eq(adminAccess.email, normalizedEmail), eq(adminAccess.active, true)))
    .limit(1)

  return Boolean(authorizedEmail)
}

export async function getAdminAccessSummary() {
  const envEmails = getEnvAdminEmails()
  const dbEntries = await db
    .select({
      email: adminAccess.email,
      active: adminAccess.active,
    })
    .from(adminAccess)

  const totalEmails = new Set(envEmails)
  const activeEmails = new Set(envEmails)

  for (const entry of dbEntries) {
    const normalizedEmail = normalizeAdminEmail(entry.email)

    if (!normalizedEmail) {
      continue
    }

    totalEmails.add(normalizedEmail)

    if (entry.active) {
      activeEmails.add(normalizedEmail)
    }
  }

  return {
    total: totalEmails.size,
    active: activeEmails.size,
  }
}

type AdminAccessTx = Pick<typeof db, 'select' | 'delete' | 'update'>

async function countActiveDatabaseAdmins(tx: AdminAccessTx) {
  const rows = await tx
    .select({ id: adminAccess.id })
    .from(adminAccess)
    .where(eq(adminAccess.active, true))
    .for('update')

  return rows.length
}

export async function getAdminAccessForUpdate(tx: AdminAccessTx, id: string) {
  const [entry] = await tx
    .select()
    .from(adminAccess)
    .where(eq(adminAccess.id, id))
    .for('update')
    .limit(1)

  return entry ?? null
}

export async function assertAdminAccessCanBeRevoked(
  tx: AdminAccessTx,
  entry: { email: string; active: boolean }
) {
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

  if (getEnvAdminEmails().length > 0) {
    return
  }

  const activeDbAdminCount = await countActiveDatabaseAdmins(tx)
  if (activeDbAdminCount <= 1) {
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
    ? await db
        .select({
          id: users.id,
          normalizedEmail: sql<string>`lower(${users.email})`,
          email: users.email,
          name: users.name,
          image: users.image,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(inArray(sql<string>`lower(${users.email})`, allEmails))
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

  const accountRows = userRows.length
    ? await db
        .select({
          userId: accounts.userId,
          lastAccessAt: sql<Date | null>`max(${accounts.updatedAt})`,
        })
        .from(accounts)
        .where(
          inArray(
            accounts.userId,
            userRows.map((user) => user.id)
          )
        )
        .groupBy(accounts.userId)
    : []

  const userByEmail = new Map(userRows.map((user) => [user.normalizedEmail, user]))
  const lastAccessByUserId = new Map<string, Date | null>(
    sessionRows.map((session) => [session.userId, normalizeTimestamp(session.lastAccessAt)])
  )

  for (const account of accountRows) {
    const accountLastAccess = normalizeTimestamp(account.lastAccessAt)

    if (!accountLastAccess) {
      continue
    }

    const currentLastAccess = lastAccessByUserId.get(account.userId)

    if (!currentLastAccess || accountLastAccess.getTime() > currentLastAccess.getTime()) {
      lastAccessByUserId.set(account.userId, accountLastAccess)
    }
  }

  const dbEntryByEmail = new Map(
    dbEntries.map((entry) => [normalizeAdminEmail(entry.email), entry])
  )

  const items: AdminAccessListItem[] = allEmails
    .map((email) => {
      const dbEntry = dbEntryByEmail.get(email) ?? null
      const user = userByEmail.get(email) ?? null
      const protectedByEnv = envEmails.includes(email)
      const source: AdminAccessListItem['source'] =
        protectedByEnv && dbEntry ? 'both' : protectedByEnv ? 'env' : 'database'

      return {
        id: dbEntry?.id ?? `env:${email}`,
        databaseId: dbEntry?.id ?? null,
        email,
        name: user?.name ?? null,
        image: user?.image ?? null,
        active: protectedByEnv || dbEntry?.active === true,
        protectedByEnv,
        source,
        lastAccessAt: normalizeTimestamp(user ? (lastAccessByUserId.get(user.id) ?? null) : null),
        createdAt: normalizeTimestamp(dbEntry?.createdAt),
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
