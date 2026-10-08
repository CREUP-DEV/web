import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { activityEntries, pressArticles } from '../../db/schema'
import { ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

/**
 * Where a campaign item lives on the site right now, as an unlocalized path, or `null` when that
 * cannot be resolved (the piece was deleted, or its type has no slug that can move).
 *
 * The snapshot freezes the path at send time, but press and activity slugs follow the title and
 * the press section follows the type, so an email read weeks later would point at a slug the
 * piece no longer carries. Resolving it at click time sends the reader straight to the current
 * URL; the frozen path stays the fallback. Area reports are addressed by their edition month,
 * which never changes, so they keep the frozen path.
 */
export async function resolveCampaignItemCurrentPath(
  itemType: string,
  itemId: string
): Promise<string | null> {
  if (itemType === 'press') {
    const [article] = await db
      .select({ type: pressArticles.type, slug: pressArticles.slug })
      .from(pressArticles)
      .where(eq(pressArticles.id, itemId))
      .limit(1)

    return article ? `${getPressArticlePublicListPath(article.type)}/${article.slug}` : null
  }

  if (itemType === 'activity') {
    const [entry] = await db
      .select({ slug: activityEntries.slug })
      .from(activityEntries)
      .where(eq(activityEntries.id, itemId))
      .limit(1)

    return entry ? `${ACTIVITY_PUBLIC_BASE_PATH}/${entry.slug}` : null
  }

  return null
}
