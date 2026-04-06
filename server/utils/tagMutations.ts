import { createError } from 'h3'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '../db'
import { tags } from '../db/schema'

export async function assertTagSlugAvailable(slug: string, excludeId?: string) {
  const existingTag = await db.query.tags.findFirst({
    where: excludeId ? and(eq(tags.slug, slug), ne(tags.id, excludeId)) : eq(tags.slug, slug),
    columns: {
      id: true,
    },
  })

  if (!existingTag) {
    return
  }

  throw createError({
    statusCode: 409,
    message: 'SLUG_EXISTS',
  })
}
