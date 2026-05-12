import { defineEventHandler, getMethod, getRequestURL, sendRedirect } from 'h3'

const REDIRECT_STATUS_CODE = 301

const exactLegacyRedirects: Record<string, string> = {
  '/ejecutiva': '/conocenos/equipo',
  '/miembros': '/conocenos/miembros?section=mores',
  '/que-es': '/conocenos/que-es',
  '/normativa': '/transparencia/normativa',
  '/normativa/rri': '/transparencia/normativa',
  '/mic': '/transparencia/mic',
  '/informes-economicos': '/transparencia/informes-economicos',
  '/aviso-legal-y-condiciones-generales': '/legal',
  '/comite-de-garantias': '/conocenos/comites',
  '/miembros-cas': '/conocenos/miembros?section=sectoriales',
  '/convenios': '/conocenos/miembros?section=sectoriales',
  '/eventos/asambleas': '/conocenos/eventos?types=Asamblea',
  '/eventos/encuentros-estatales': '/conocenos/eventos?types=Congreso%20y%20Encuentro',
  '/eventos/stages-formativos': '/conocenos/eventos?types=Stage%20Formativo',
  '/areas': '/conocenos/equipo?view=area',
  '/comunicacion': '/prensa/noticias',
  '/newsletter': '/prensa/newsletter',
  '/notas-de-prensa': '/prensa/noticias?types=press_release',
  '/comunicados': '/prensa/noticias?types=statement',
  '/apariciones-en-los-medios': '/prensa/noticias?types=media_appearance',
  '/posicionamientos': '/politica/posicionamientos',
  '/resoluciones': '/politica/resoluciones',
  '/informes-ejecutivos': '/politica/informes-ejecutivos',
  '/cai': '/conocenos/comites',
  '/cas': '/comision-de-asuntos-sectoriales',
  '/cdg': '/conocenos/comites',
}

const prefixLegacyRedirects: Array<[prefix: string, target: string]> = [
  ['/comunicacion/', '/prensa/noticias'],
  ['/author/admintic_creup', '/prensa/noticias'],
  ['/areas/eventos', '/conocenos/eventos'],
  ['/eventos/asambleas', '/conocenos/eventos?types=Asamblea'],
  ['/eventos/encuentros-estatales', '/conocenos/eventos?types=Congreso%20y%20Encuentro'],
  ['/eventos/stages-formativos', '/conocenos/eventos?types=Stage%20Formativo'],
  ['/eventos/', '/conocenos/eventos'],
  ['/congresos', '/conocenos/eventos?types=Congreso%20y%20Encuentro'],
  ['/asambleas', '/conocenos/eventos?types=Asamblea'],
  ['/stages formativos', '/conocenos/eventos?types=Stage%20Formativo'],
]

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

function normalizeLegacyPath(pathname: string) {
  const decodedPathname = decodePathname(pathname)
  const normalized = decodedPathname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')

  return normalized || '/'
}

function appendSearch(target: string, search: string) {
  if (!search) {
    return target
  }

  return `${target}${target.includes('?') ? '&' : '?'}${search.slice(1)}`
}

function findLegacyRedirect(pathname: string) {
  const normalizedPath = normalizeLegacyPath(pathname)
  const exactTarget = exactLegacyRedirects[normalizedPath]

  if (exactTarget) {
    return exactTarget
  }

  return prefixLegacyRedirects.find(([prefix]) => normalizedPath.startsWith(prefix))?.[1] ?? null
}

export default defineEventHandler((event) => {
  const method = getMethod(event)

  if (method !== 'GET' && method !== 'HEAD') {
    return
  }

  const requestUrl = getRequestURL(event)
  const redirectTarget = findLegacyRedirect(requestUrl.pathname)

  if (!redirectTarget) {
    return
  }

  return sendRedirect(event, appendSearch(redirectTarget, requestUrl.search), REDIRECT_STATUS_CODE)
})
