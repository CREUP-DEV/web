import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'

export default defineEventHandler(async () => {
  const items = await db.query.tags.findMany({
    orderBy: [asc(tags.order), asc(tags.id)],
    with: { translations: true },
  })

  return {
    data: items,
    items,
  }
})
