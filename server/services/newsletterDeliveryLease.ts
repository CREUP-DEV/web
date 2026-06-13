import { createId } from '@paralleldrive/cuid2'
import { and, eq, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'

// 2 min stale threshold: worker must heartbeat every iteration; if silent for 2+ min, assume crashed and allow claim
export const NEWSLETTER_DELIVERY_WORKER_STALE_MS = 2 * 60 * 1000

export function getNewsletterDeliveryStaleBefore() {
  return new Date(Date.now() - NEWSLETTER_DELIVERY_WORKER_STALE_MS)
}

export async function touchNewsletterDeliveryWorker(newsletterId: string, workerToken: string) {
  await db
    .update(newsletters)
    .set({
      lastDeliveryHeartbeatAt: new Date(),
    })
    .where(
      and(eq(newsletters.id, newsletterId), eq(newsletters.lastDeliveryWorkerToken, workerToken))
    )
}

export async function isNewsletterDeliveryWorkerCurrent(newsletterId: string, workerToken: string) {
  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
    columns: {
      id: true,
      lastDeliveryFinishedAt: true,
      lastDeliveryWorkerToken: true,
    },
  })

  return Boolean(
    item && item.lastDeliveryFinishedAt === null && item.lastDeliveryWorkerToken === workerToken
  )
}

export async function claimNewsletterDeliveryWorker(id: string) {
  const workerToken = createId()
  const now = new Date()
  const staleBefore = getNewsletterDeliveryStaleBefore()

  const [item] = await db
    .update(newsletters)
    .set({
      lastDeliveryFinishedAt: null,
      lastDeliveryHeartbeatAt: now,
      lastDeliveryStartedAt: sql`coalesce(${newsletters.lastDeliveryStartedAt}, ${now})`,
      lastDeliveryWorkerToken: workerToken,
    })
    .where(
      and(
        eq(newsletters.id, id),
        isNull(newsletters.sentAt),
        or(
          isNull(newsletters.lastDeliveryWorkerToken),
          and(
            isNotNull(newsletters.lastDeliveryWorkerToken),
            or(
              isNull(newsletters.lastDeliveryHeartbeatAt),
              lte(newsletters.lastDeliveryHeartbeatAt, staleBefore)
            )
          )
        )
      )
    )
    .returning()

  return item ?? null
}

export async function releaseNewsletterDeliveryWorker(
  newsletterId: string,
  workerToken: string,
  values: Partial<typeof newsletters.$inferInsert> = {}
) {
  await db
    .update(newsletters)
    .set({
      ...values,
      lastDeliveryWorkerToken: null,
    })
    .where(
      and(eq(newsletters.id, newsletterId), eq(newsletters.lastDeliveryWorkerToken, workerToken))
    )
}
