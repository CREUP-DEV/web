import { ADMIN_ROUTES } from './adminRoutes'

export type AdminSectionKey =
  | 'access'
  | 'stats'
  | 'carousel'
  | 'about'
  | 'equality'
  | 'newsletter'
  | 'press'
  | 'pressDossier'
  | 'siteDefaultImages'
  | 'links'
  | 'tags'
  | 'media'
  | 'financialReports'

export interface AdminSectionDefinition {
  key: AdminSectionKey
  name: string
  description: string
  to: string
  icon: string
  envOnly?: boolean
}

export const ADMIN_SECTION_DEFINITIONS: AdminSectionDefinition[] = [
  {
    key: 'access',
    name: 'Accesos',
    description: 'Personas autorizadas para entrar al panel.',
    to: ADMIN_ROUTES.access,
    icon: 'i-tabler-shield-lock',
  },
  {
    key: 'stats',
    name: 'Estado',
    description: 'Métricas operativas y salud básica del servicio.',
    to: ADMIN_ROUTES.stats,
    icon: 'i-tabler-activity-heartbeat',
    envOnly: true,
  },
  {
    key: 'carousel',
    name: 'Carrusel',
    description: 'Slides destacados de la portada.',
    to: ADMIN_ROUTES.carousel,
    icon: 'i-tabler-photo',
  },
  {
    key: 'about',
    name: 'Qué es CREUP',
    description: 'Banner principal de la página.',
    to: ADMIN_ROUTES.about,
    icon: 'i-tabler-info-circle',
  },
  {
    key: 'equality',
    name: 'Igualdad',
    description: 'Documentos y tarjetas de la página de igualdad.',
    to: ADMIN_ROUTES.equality,
    icon: 'i-tabler-scale',
  },
  {
    key: 'newsletter',
    name: 'Newsletter',
    description: 'Ediciones publicadas y listas para envío.',
    to: ADMIN_ROUTES.newsletter,
    icon: 'i-tabler-mail',
  },
  {
    key: 'press',
    name: 'Noticias',
    description: 'Artículos, comunicados y apariciones en medios.',
    to: ADMIN_ROUTES.press,
    icon: 'i-tabler-news',
  },
  {
    key: 'pressDossier',
    name: 'Dossier de prensa',
    description: 'PDF enlazado desde el menú de navegación.',
    to: ADMIN_ROUTES.pressDossier,
    icon: 'i-tabler-file-type-pdf',
  },
  {
    key: 'siteDefaultImages',
    name: 'Imágenes por defecto',
    description: 'Portadas de prensa, newsletter y carrusel cuando no hay imagen propia.',
    to: ADMIN_ROUTES.siteDefaultImages,
    icon: 'i-tabler-photo-scan',
  },
  {
    key: 'links',
    name: 'Enlaces',
    description: 'Bloques destacados y accesos rápidos.',
    to: ADMIN_ROUTES.links,
    icon: 'i-tabler-link',
  },
  {
    key: 'tags',
    name: 'Etiquetas',
    description: 'Taxonomía usada para clasificar prensa.',
    to: ADMIN_ROUTES.tags,
    icon: 'i-tabler-tags',
  },
  {
    key: 'media',
    name: 'Medios',
    description: 'Medios asociados a apariciones en prensa.',
    to: ADMIN_ROUTES.media,
    icon: 'i-tabler-broadcast',
  },
  {
    key: 'financialReports',
    name: 'Informes económicos',
    description: 'Informes aprobados por la Asamblea General.',
    to: ADMIN_ROUTES.financialReports,
    icon: 'i-tabler-file-analytics',
  },
]
