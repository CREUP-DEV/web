import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { monthKeyToDate } from '../utils/newsletters'
import { publicPaginationQuerySchema, validateQuery } from '../utils/validation'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, publicPaginationQuerySchema)

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(newsletters)
      .where(eq(newsletters.active, true))
      .orderBy(desc(newsletters.month))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(newsletters)
      .where(eq(newsletters.active, true)),
  ])

  return {
    items: items.map((item) => ({
      active: item.active,
      coverImage:
        toExternalImageProxyUrl(item.coverImage, {
          publicPathBase: '/prensa/newsletter/portadas',
        }) ?? item.coverImage,
      id: item.id,
      month: monthKeyToDate(item.monthKey),
      pdfUrl:
        toExternalPdfProxyUrl(item.pdfUrl, {
          publicPathBase: '/prensa/newsletter/documentos',
        }) ?? item.pdfUrl,
    })),
    total: countResult[0]?.count ?? 0,
  }
})
