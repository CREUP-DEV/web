import {
  ACTIVITY_DEFAULT_IMAGES_PUBLIC_PATH,
  ACTIVITY_IMAGE_PUBLIC_BASE,
  AREA_REPORTS_DEFAULT_IMAGES_PUBLIC_PATH,
  AREA_REPORTS_IMAGE_PUBLIC_BASE,
  HOME_CAROUSEL_SITE_DEFAULT_PUBLIC_PATH,
  HOME_IMAGE_PUBLIC_BASE,
  NEWSLETTER_SITE_DEFAULT_COVER_PUBLIC_PATH,
  PRESS_DEFAULT_COVERS_PUBLIC_PATH,
  PRESS_IMAGE_PUBLIC_BASE,
  SITE_OG_IMAGE_PUBLIC_PATH,
} from './assetPaths'

/** DB `site_default_images.scope` values. */
export const SITE_DEFAULT_IMAGE_SCOPE = {
  press: 'press',
  newsletter: 'newsletter',
  carousel: 'carousel',
  seo: 'seo',
  activity: 'activity',
  areaReport: 'area_report',
} as const

export type SiteDefaultImageScope =
  (typeof SITE_DEFAULT_IMAGE_SCOPE)[keyof typeof SITE_DEFAULT_IMAGE_SCOPE]

/** DB `site_default_images.slot` values (unique per scope). */
export const SITE_DEFAULT_IMAGE_SLOT = {
  pressRelease: 'press_release',
  statement: 'statement',
  mediaAppearance: 'media_appearance',
  newsletterCover: 'cover',
  carouselSlide: 'slide',
  ogImage: 'og_image',
  activityEntry: 'entry',
  areaReport: 'report',
} as const

export type SiteDefaultImageSlot =
  (typeof SITE_DEFAULT_IMAGE_SLOT)[keyof typeof SITE_DEFAULT_IMAGE_SLOT]

export interface SiteDefaultImageSlotDefinition {
  scope: SiteDefaultImageScope
  slot: string
  /** Passed to `finalizeAdminImage` as `slug` / basename hint. */
  finalizeSlug: string
  uploadDir: string
  publicPath: string
  /** Base path for `toExternalImageProxyUrl` when resolving public URLs. */
  proxyPublicBase: string
  /** Keep each replacement URL unique for consumers that cache image URLs aggressively. */
  uniqueFilename?: boolean
}

export const SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS: readonly SiteDefaultImageSlotDefinition[] = [
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.pressRelease,
    finalizeSlug: 'portada-nota-prensa',
    uploadDir: 'public/prensa/imagenes/portadas-por-defecto',
    publicPath: PRESS_DEFAULT_COVERS_PUBLIC_PATH,
    proxyPublicBase: PRESS_IMAGE_PUBLIC_BASE,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.statement,
    finalizeSlug: 'portada-comunicado',
    uploadDir: 'public/prensa/imagenes/portadas-por-defecto',
    publicPath: PRESS_DEFAULT_COVERS_PUBLIC_PATH,
    proxyPublicBase: PRESS_IMAGE_PUBLIC_BASE,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.mediaAppearance,
    finalizeSlug: 'portada-aparicion-medios',
    uploadDir: 'public/prensa/imagenes/portadas-por-defecto',
    publicPath: PRESS_DEFAULT_COVERS_PUBLIC_PATH,
    proxyPublicBase: PRESS_IMAGE_PUBLIC_BASE,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.newsletter,
    slot: SITE_DEFAULT_IMAGE_SLOT.newsletterCover,
    finalizeSlug: 'portada-newsletter-defecto',
    uploadDir: 'public/prensa/newsletter/imagenes-por-defecto',
    publicPath: NEWSLETTER_SITE_DEFAULT_COVER_PUBLIC_PATH,
    proxyPublicBase: NEWSLETTER_SITE_DEFAULT_COVER_PUBLIC_PATH,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.carousel,
    slot: SITE_DEFAULT_IMAGE_SLOT.carouselSlide,
    finalizeSlug: 'banner-carrusel-defecto',
    uploadDir: 'public/inicio/imagenes/carrusel-por-defecto',
    publicPath: HOME_CAROUSEL_SITE_DEFAULT_PUBLIC_PATH,
    proxyPublicBase: HOME_IMAGE_PUBLIC_BASE,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.seo,
    slot: SITE_DEFAULT_IMAGE_SLOT.ogImage,
    finalizeSlug: 'creup-og',
    uploadDir: 'public/og',
    publicPath: SITE_OG_IMAGE_PUBLIC_PATH,
    proxyPublicBase: SITE_OG_IMAGE_PUBLIC_PATH,
    uniqueFilename: true,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.activity,
    slot: SITE_DEFAULT_IMAGE_SLOT.activityEntry,
    finalizeSlug: 'imagen-actividad-defecto',
    uploadDir: 'public/transparencia/actividad/imagenes/imagenes-por-defecto',
    publicPath: ACTIVITY_DEFAULT_IMAGES_PUBLIC_PATH,
    proxyPublicBase: ACTIVITY_IMAGE_PUBLIC_BASE,
  },
  {
    scope: SITE_DEFAULT_IMAGE_SCOPE.areaReport,
    slot: SITE_DEFAULT_IMAGE_SLOT.areaReport,
    finalizeSlug: 'imagen-informe-area-defecto',
    uploadDir: 'public/transparencia/informes-areas/imagenes/imagenes-por-defecto',
    publicPath: AREA_REPORTS_DEFAULT_IMAGES_PUBLIC_PATH,
    proxyPublicBase: AREA_REPORTS_IMAGE_PUBLIC_BASE,
  },
] as const

export function getSiteDefaultSlotDefinition(
  scope: string,
  slot: string
): SiteDefaultImageSlotDefinition | undefined {
  return SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS.find((d) => d.scope === scope && d.slot === slot)
}
