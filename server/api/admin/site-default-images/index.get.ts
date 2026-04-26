import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import { loadSiteDefaultImagesMap } from '../../../utils/admin/siteDefaultImages'

function maxUpdatedAtIso(rows: { updatedAt: Date }[]): string | null {
  if (!rows.length) return null
  const ms = Math.max(...rows.map((r) => r.updatedAt.getTime()))
  return new Date(ms).toISOString()
}

export default defineEventHandler(async () => {
  const map = await loadSiteDefaultImagesMap()
  const press = map.get(SITE_DEFAULT_IMAGE_SCOPE.press)
  const newsletter = map.get(SITE_DEFAULT_IMAGE_SCOPE.newsletter)
  const carousel = map.get(SITE_DEFAULT_IMAGE_SCOPE.carousel)

  const rows = await db.query.siteDefaultImages.findMany({ columns: { updatedAt: true } })

  return {
    data: {
      pressReleaseImage: press?.get(SITE_DEFAULT_IMAGE_SLOT.pressRelease) ?? null,
      statementImage: press?.get(SITE_DEFAULT_IMAGE_SLOT.statement) ?? null,
      mediaAppearanceImage: press?.get(SITE_DEFAULT_IMAGE_SLOT.mediaAppearance) ?? null,
      newsletterCoverImage: newsletter?.get(SITE_DEFAULT_IMAGE_SLOT.newsletterCover) ?? null,
      carouselSlideImage: carousel?.get(SITE_DEFAULT_IMAGE_SLOT.carouselSlide) ?? null,
      updatedAt: maxUpdatedAtIso(rows),
    },
  }
})
