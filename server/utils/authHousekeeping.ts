import { lte } from 'drizzle-orm'
import { db } from '../db'
import { sessions, verifications } from '../db/schema'

export interface ExpiredAuthCleanupResult {
  deletedSessionCount: number
  deletedVerificationCount: number
}

export async function cleanupExpiredAuthRows(
  now: Date = new Date()
): Promise<ExpiredAuthCleanupResult> {
  const [deletedSessions, deletedVerifications] = await Promise.all([
    db.delete(sessions).where(lte(sessions.expiresAt, now)).returning({ id: sessions.id }),
    db
      .delete(verifications)
      .where(lte(verifications.expiresAt, now))
      .returning({ id: verifications.id }),
  ])

  return {
    deletedSessionCount: deletedSessions.length,
    deletedVerificationCount: deletedVerifications.length,
  }
}
