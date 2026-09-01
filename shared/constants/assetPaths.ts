export const EXTERNAL_IMAGE_PUBLIC_BASE = '/imagenes/externas'
export const EXTERNAL_DOCUMENT_PUBLIC_BASE = '/documentos/externos'

export const HOME_IMAGE_PUBLIC_BASE = '/inicio/imagenes'
export const HOME_CAROUSEL_IMAGE_PUBLIC_PATH = `${HOME_IMAGE_PUBLIC_BASE}/carrusel`
/** Site default slide image (admin-managed under this path). */
export const HOME_CAROUSEL_SITE_DEFAULT_PUBLIC_PATH = `${HOME_IMAGE_PUBLIC_BASE}/carrusel-por-defecto`
export const HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH = `${HOME_IMAGE_PUBLIC_BASE}/enlaces-destacados`

export const SITE_OG_IMAGE_PUBLIC_PATH = '/og'

export const ABOUT_IMAGE_PUBLIC_PATH = '/conocenos/imagenes'
export const ABOUT_HERO_DEFAULT_IMAGE = `${ABOUT_IMAGE_PUBLIC_PATH}/banner-que-es-creup.webp`

export const EVENT_IMAGE_PUBLIC_BASE = '/eventos/imagenes'
export const EVENT_DOCUMENT_PUBLIC_BASE = '/eventos/documentos'

export const PRESS_IMAGE_PUBLIC_BASE = '/prensa/imagenes'
/** Admin-uploaded fallbacks when a press article has no `image`; stored under `public/prensa/imagenes/`. */
export const PRESS_DEFAULT_COVERS_SEGMENT = 'portadas-por-defecto'
export const PRESS_DEFAULT_COVERS_PUBLIC_PATH = `${PRESS_IMAGE_PUBLIC_BASE}/${PRESS_DEFAULT_COVERS_SEGMENT}`
export const PRESS_MEDIA_LOGO_PUBLIC_PATH = `${PRESS_IMAGE_PUBLIC_BASE}/medios`
export const PRESS_DOCUMENT_PUBLIC_PATH = '/prensa/documentos'
export const PRESS_DOSSIER_PUBLIC_PATH = '/prensa/dossier-prensa.pdf'
/** Site default newsletter cover (admin-managed; distinct from per-edition covers). */
export const NEWSLETTER_BRAND_BANNER_PATH = '/marca/horizontal-completo-granate.png'

// Activity section ("Actividad"). One parent folder with sub-folders keeps the number of
// per-folder serve handlers + docker volume mounts low (plan §9.1).
export const ACTIVITY_IMAGE_PUBLIC_BASE = '/transparencia/actividad/imagenes'
/** Admin-uploaded fallbacks (per kind) when an activity entry has no `image`. */
export const ACTIVITY_DEFAULT_IMAGES_SEGMENT = 'imagenes-por-defecto'
export const ACTIVITY_DEFAULT_IMAGES_PUBLIC_PATH = `${ACTIVITY_IMAGE_PUBLIC_BASE}/${ACTIVITY_DEFAULT_IMAGES_SEGMENT}`
/** Logos uploaded for manual member organisations (synced ones keep the upstream URL). Nested
 * under the activity base so it needs no serve handler or volume mount of its own. */
export const MEMBER_ORG_LOGOS_SEGMENT = 'organizaciones'
export const MEMBER_ORG_LOGOS_PUBLIC_PATH = `${ACTIVITY_IMAGE_PUBLIC_BASE}/${MEMBER_ORG_LOGOS_SEGMENT}`
export const AREA_REPORTS_IMAGE_PUBLIC_BASE = '/transparencia/informes-areas/imagenes'
/** Admin-uploaded fallback when an area report has no `image`. */
export const AREA_REPORTS_DEFAULT_IMAGES_SEGMENT = 'imagenes-por-defecto'
export const AREA_REPORTS_DEFAULT_IMAGES_PUBLIC_PATH = `${AREA_REPORTS_IMAGE_PUBLIC_BASE}/${AREA_REPORTS_DEFAULT_IMAGES_SEGMENT}`

export const INTERNAL_IMAGE_PROXY_PATH_BASES = [
  EXTERNAL_IMAGE_PUBLIC_BASE,
  HOME_IMAGE_PUBLIC_BASE,
  ABOUT_IMAGE_PUBLIC_PATH,
  EVENT_IMAGE_PUBLIC_BASE,
  SITE_OG_IMAGE_PUBLIC_PATH,
  PRESS_IMAGE_PUBLIC_BASE,
  ACTIVITY_IMAGE_PUBLIC_BASE,
  AREA_REPORTS_IMAGE_PUBLIC_BASE,
] as const

export const INTERNAL_DOCUMENT_PROXY_PATH_BASES = [
  EXTERNAL_DOCUMENT_PUBLIC_BASE,
  EVENT_DOCUMENT_PUBLIC_BASE,
  PRESS_DOCUMENT_PUBLIC_PATH,
] as const

export const INTERNAL_ASSET_PROXY_PATH_BASES = [
  ...INTERNAL_IMAGE_PROXY_PATH_BASES,
  ...INTERNAL_DOCUMENT_PROXY_PATH_BASES,
] as const

export const EQUALITY_DOCUMENTS_PUBLIC_PATH = '/documentos/igualdad'
export const FINANCIAL_REPORTS_PUBLIC_PATH = '/documentos/informes-economicos'
