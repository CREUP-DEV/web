export type AdminSectionKey =
  | 'access'
  | 'carousel'
  | 'about'
  | 'equality'
  | 'newsletter'
  | 'press'
  | 'pressDossier'
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
}

export const ADMIN_SECTION_DEFINITIONS: AdminSectionDefinition[] = [
  {
    key: 'access',
    name: 'Accesos',
    description: 'Personas autorizadas para entrar al panel.',
    to: '/admin/access',
    icon: 'i-tabler-shield-lock',
  },
  {
    key: 'carousel',
    name: 'Carrusel',
    description: 'Slides destacados de la portada.',
    to: '/admin/carousel',
    icon: 'i-tabler-photo',
  },
  {
    key: 'about',
    name: 'Qué es CREUP',
    description: 'Banner principal de la página.',
    to: '/admin/about',
    icon: 'i-tabler-info-circle',
  },
  {
    key: 'equality',
    name: 'Igualdad',
    description: 'Documentos y tarjetas de la página de igualdad.',
    to: '/admin/equality',
    icon: 'i-tabler-scale',
  },
  {
    key: 'newsletter',
    name: 'Newsletter',
    description: 'Ediciones publicadas y listas para envío.',
    to: '/admin/newsletter',
    icon: 'i-tabler-mail',
  },
  {
    key: 'press',
    name: 'Prensa',
    description: 'Artículos, comunicados y apariciones en medios.',
    to: '/admin/press',
    icon: 'i-tabler-news',
  },
  {
    key: 'pressDossier',
    name: 'Dossier de prensa',
    description: 'PDF enlazado desde el menú de navegación.',
    to: '/admin/press-dossier',
    icon: 'i-tabler-file-type-pdf',
  },
  {
    key: 'links',
    name: 'Enlaces',
    description: 'Bloques destacados y accesos rápidos.',
    to: '/admin/links',
    icon: 'i-tabler-link',
  },
  {
    key: 'tags',
    name: 'Etiquetas',
    description: 'Taxonomía usada para clasificar prensa.',
    to: '/admin/tags',
    icon: 'i-tabler-tags',
  },
  {
    key: 'media',
    name: 'Medios',
    description: 'Medios asociados a apariciones en prensa.',
    to: '/admin/media',
    icon: 'i-tabler-broadcast',
  },
  {
    key: 'financialReports',
    name: 'Informes económicos',
    description: 'Informes aprobados por la Asamblea General.',
    to: '/admin/financial-reports',
    icon: 'i-tabler-file-analytics',
  },
]
