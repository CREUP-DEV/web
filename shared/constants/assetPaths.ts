export const EXTERNAL_IMAGE_PUBLIC_BASE = '/imagenes/externas'
export const EXTERNAL_DOCUMENT_PUBLIC_BASE = '/documentos/externos'

export const HOME_IMAGE_PUBLIC_BASE = '/inicio/imagenes'
export const HOME_CAROUSEL_IMAGE_PUBLIC_PATH = `${HOME_IMAGE_PUBLIC_BASE}/carrusel`
export const HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH = `${HOME_IMAGE_PUBLIC_BASE}/enlaces-destacados`
export const HOME_CAROUSEL_FALLBACK_IMAGE = `${HOME_CAROUSEL_IMAGE_PUBLIC_PATH}/banner-inicio-creup.webp`

export const ABOUT_IMAGE_PUBLIC_PATH = '/conocenos/imagenes'
export const ABOUT_HERO_DEFAULT_IMAGE = `${ABOUT_IMAGE_PUBLIC_PATH}/banner-que-es-creup.webp`

export const EVENT_IMAGE_PUBLIC_BASE = '/eventos/imagenes'
export const EVENT_DOCUMENT_PUBLIC_BASE = '/eventos/documentos'

export const PRESS_IMAGE_PUBLIC_BASE = '/prensa/imagenes'
export const PRESS_MEDIA_LOGO_PUBLIC_PATH = `${PRESS_IMAGE_PUBLIC_BASE}/medios`
export const PRESS_DOCUMENT_PUBLIC_PATH = '/prensa/documentos'
export const PRESS_DOSSIER_PUBLIC_PATH = '/prensa/dossier'
export const NEWSLETTER_COVER_IMAGE_PUBLIC_PATH = '/prensa/newsletter/portadas'
export const NEWSLETTER_DOCUMENT_PUBLIC_PATH = '/prensa/newsletter/documentos'
export const NEWSLETTER_BRAND_BANNER_PATH = '/documentos/imagen/MIC/horizontal-completo-granate.png'

export const INTERNAL_IMAGE_PROXY_PATH_BASES = [
  EXTERNAL_IMAGE_PUBLIC_BASE,
  HOME_IMAGE_PUBLIC_BASE,
  ABOUT_IMAGE_PUBLIC_PATH,
  EVENT_IMAGE_PUBLIC_BASE,
  PRESS_IMAGE_PUBLIC_BASE,
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
] as const

export const INTERNAL_DOCUMENT_PROXY_PATH_BASES = [
  EXTERNAL_DOCUMENT_PUBLIC_BASE,
  EVENT_DOCUMENT_PUBLIC_BASE,
  PRESS_DOCUMENT_PUBLIC_PATH,
  PRESS_DOSSIER_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
] as const

export const INTERNAL_ASSET_PROXY_PATH_BASES = [
  ...INTERNAL_IMAGE_PROXY_PATH_BASES,
  ...INTERNAL_DOCUMENT_PROXY_PATH_BASES,
] as const

export const EQUALITY_DOCUMENTS_PUBLIC_PATH = '/documentos/igualdad'
export const FINANCIAL_REPORTS_PUBLIC_PATH = '/documentos/informes-economicos'
