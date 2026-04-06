import { defineEventHandler } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { monthKeyToDate } from '../utils/newsletters'

export default defineEventHandler(async () => {
  const items = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.active, true))
    .orderBy(desc(newsletters.month))

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
  }
})
