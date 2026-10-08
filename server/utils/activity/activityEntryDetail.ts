import type { H3Event } from 'h3'
import { and, eq, type SQL } from 'drizzle-orm'
import { db } from '../../db'
import { activityEntries, activityEntrySlugHistory } from '../../db/schema'
import type { MemberOrgSnapshot } from '../../db/schema/activity'
import { getBaseLanguage } from '~~/shared/utils/locale'
import { isActivityEntryPublic } from '~~/shared/utils/publicVisibility'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import { toExternalImageProxyUrl } from '../external/externalAssetUrl'
import {
  loadSiteDefaultImageEntriesMap,
  resolveSiteDefaultImageUrlWithVersion,
} from '../admin/siteDefaultImages'
import { appendAssetVersion } from '../core/assetVersion'
import { getRequestLocaleContext } from '../locale/requestLocale'
import { resolveActivityTranslation } from './activityTranslation'

/**
 * The activity detail payload, single-sourced for the public page (`/api/activity/[slug]`) and
 * the admin preview (`/api/admin/activity/[id]/preview`) so the preview cannot drift from what
 * gets published. Only the lookup differs: the public one is gated and follows former slugs, the
 * preview is by id.
 */

function findActivityEntryForDetail(where: SQL | undefined) {
  return db.query.activityEntries.findFirst({
    where,
    with: {
      translations: {
        columns: {
          locale: true,
          title: true,
          excerpt: true,
          alt: true,
          imageCaption: true,
          contentHtml: true,
        },
      },
    },
  })
}

type ActivityEntryDetailRow = NonNullable<Awaited<ReturnType<typeof findActivityEntryForDetail>>>

/**
 * The organiser as the public payloads expose it. The logos are frozen into the entry's snapshot
 * and only change when the entry is saved, so the entry's `updatedAt` versions them.
 */
export function buildActivityMemberOrgPayload(
  kind: ActivityEntryDetailRow['kind'],
  snapshot: MemberOrgSnapshot | null,
  updatedAt: Date | null | undefined
) {
  if (kind !== 'member' || !snapshot) {
    return null
  }

  return {
    denomination: snapshot.denomination,
    initials: snapshot.initials,
    logoLight: appendAssetVersion(snapshot.logoLight, updatedAt),
    logoDark: appendAssetVersion(snapshot.logoDark, updatedAt),
  }
}

/**
 * The public entry a slug leads to: the one carrying it now, or else the one that carried it
 * before (its detail page then redirects to the current slug). Either way only if it is active.
 */
export async function findPublicActivityEntryBySlug(slug: string) {
  const current = await findActivityEntryForDetail(
    and(eq(activityEntries.slug, slug), eq(activityEntries.active, true))
  )
  if (current) {
    return current
  }

  const [former] = await db
    .select({ activityEntryId: activityEntrySlugHistory.activityEntryId })
    .from(activityEntrySlugHistory)
    .where(eq(activityEntrySlugHistory.slug, slug))
    .limit(1)

  if (!former) {
    return undefined
  }

  return findActivityEntryForDetail(
    and(eq(activityEntries.id, former.activityEntryId), eq(activityEntries.active, true))
  )
}

/** Any entry by id, whatever its status — the admin preview. */
export function findActivityEntryForPreview(id: string) {
  return findActivityEntryForDetail(eq(activityEntries.id, id))
}

/** Loads the site default images the payload falls back to; run it alongside the lookup. */
export function loadActivityEntryDetailDefaults() {
  return loadSiteDefaultImageEntriesMap()
}

export function buildActivityEntryDetailPayload(
  event: H3Event,
  entry: ActivityEntryDetailRow,
  siteDefaultImageEntries: Awaited<ReturnType<typeof loadActivityEntryDetailDefaults>>
) {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const trans = resolveActivityTranslation(entry.translations, locale, fallbackLocale)

  const defaultImage = resolveSiteDefaultImageUrlWithVersion(
    siteDefaultImageEntries,
    SITE_DEFAULT_IMAGE_SCOPE.activity,
    SITE_DEFAULT_IMAGE_SLOT.activityEntry
  )

  // Locale codes that have an actual native translation stored.
  const translatedLocales = entry.translations
    .map((translation) => getBaseLanguage(translation.locale))
    .filter((code): code is string => !!code)

  return {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    image: entry.image
      ? appendAssetVersion(
          toExternalImageProxyUrl(entry.image, {
            publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE,
          }) ?? entry.image,
          entry.updatedAt
        )
      : defaultImage,
    startDate: entry.startDate,
    endDate: entry.endDate,
    isOnline: entry.isOnline,
    location: entry.location,
    title: trans.title,
    excerpt: trans.excerpt,
    alt: trans.alt,
    imageCaption: trans.imageCaption,
    contentHtml: trans.contentHtml ?? null,
    titleLocale: trans.titleLocale,
    excerptLocale: trans.excerptLocale,
    imageCaptionLocale: trans.imageCaptionLocale,
    contentLocale: trans.contentLocale,
    publishedAt: entry.startDate,
    updatedAt: entry.updatedAt?.toISOString() ?? null,
    translatedLocales,
    memberOrg: buildActivityMemberOrgPayload(entry.kind, entry.memberOrgSnapshot, entry.updatedAt),
  }
}

/** What the preview banner needs to say why the entry is not public. */
export function buildActivityEntryPreviewStatus(entry: ActivityEntryDetailRow) {
  return {
    active: entry.active,
    isPublic: isActivityEntryPublic({ active: entry.active }),
  }
}
