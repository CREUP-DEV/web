import { desc, sql } from 'drizzle-orm'
import { PRESS_TYPE_LABELS } from '~~/shared/constants/pressTypes'
import type { AdminSectionKey } from '~~/shared/constants/adminSections'
import { DEFAULT_LOCALE_CODE } from '~~/shared/utils/locale'
import { db } from '../db'
import {
  carouselItems,
  equalityDocuments,
  featuredLinks,
  financialReports,
  mediaOutlets,
  newsletters,
  pressArticles,
  tags,
} from '../db/schema'
import { getAdminAccessSummary } from './adminAccess'

export interface AdminSectionSummary {
  total?: number
  active?: number | null
  statusLabel?: string | null
  statusColor?: 'success' | 'warning' | 'neutral'
}

export interface DashboardAttentionItem {
  sectionKey: AdminSectionKey
  title: string
  description: string
  to: string
  actionLabel: string
  tone: 'warning' | 'error' | 'neutral'
}

export interface DashboardRecentActivityItem {
  sectionKey: AdminSectionKey
  title: string
  description: string
  to: string
  updatedAt: string
}

type DashboardRecentActivityDraft = Omit<DashboardRecentActivityItem, 'updatedAt'> & {
  updatedAt: Date
}

interface TranslationLike {
  locale: string
  [key: string]: string | null
}

const pressTypeLabelsByKey = PRESS_TYPE_LABELS as Record<string, string>

const isDefined = <T>(value: T | null): value is T => value !== null
const toNumber = (value: unknown) => Number(value ?? 0)

const getTranslatedValue = <T extends TranslationLike>(
  translations: T[] | undefined,
  key: Exclude<keyof T, 'locale'>,
  fallback: string
) => {
  if (!translations?.length) {
    return fallback
  }

  const normalizedKey = String(key)
  const preferredTranslation =
    translations.find((translation) => translation.locale === DEFAULT_LOCALE_CODE) ??
    translations[0]
  const preferredValue = preferredTranslation?.[normalizedKey]

  if (typeof preferredValue === 'string' && preferredValue.trim()) {
    return preferredValue.trim()
  }

  const fallbackTranslation = translations.find((translation) => {
    const value = translation[normalizedKey]
    return typeof value === 'string' && value.trim()
  })

  if (fallbackTranslation) {
    return String(fallbackTranslation[normalizedKey]).trim()
  }

  return fallback
}

const formatNewsletterMonth = (monthKey: string) => {
  const label = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`))

  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface AdminDashboardMetrics {
  carouselActive: number
  carouselTotal: number
  equalityActive: number
  equalityTotal: number
  financialReportsActive: number
  financialReportsTotal: number
  linksActive: number
  linksTotal: number
  mediaTotal: number
  newsletterDeliveryPending: number
  newsletterDeliverySending: number
  newsletterSubscribersActive: number
  newsletterSubscribersTotal: number
  newslettersActive: number
  newslettersTotal: number
  pressActive: number
  pressTotal: number
  tagsTotal: number
}

async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const result = await db.execute(sql`
    select
      (select count(*)::int from carousel_items) as carousel_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from carousel_items) as carousel_active,
      (select count(*)::int from equality_documents) as equality_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from equality_documents) as equality_active,
      (select count(*)::int from newsletters) as newsletters_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from newsletters) as newsletters_active,
      (select count(*)::int from press_articles) as press_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from press_articles) as press_active,
      (select count(*)::int from featured_links) as links_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from featured_links) as links_active,
      (select count(*)::int from tags) as tags_total,
      (select count(*)::int from media_outlets) as media_total,
      (select count(*)::int from financial_reports) as financial_reports_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from financial_reports) as financial_reports_active,
      (select count(*)::int from newsletter_subscribers) as newsletter_subscribers_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from newsletter_subscribers) as newsletter_subscribers_active,
      (
        select coalesce(
          sum(
            case
              when active and sent_at is null and last_delivery_worker_token is null then 1
              else 0
            end
          ),
          0
        )::int
        from newsletters
      ) as newsletter_delivery_pending,
      (
        select coalesce(sum(case when last_delivery_worker_token is not null then 1 else 0 end), 0)::int
        from newsletters
      ) as newsletter_delivery_sending
  `)

  const row = (result.rows?.[0] ?? {}) as Record<string, unknown>

  return {
    carouselActive: toNumber(row.carousel_active),
    carouselTotal: toNumber(row.carousel_total),
    equalityActive: toNumber(row.equality_active),
    equalityTotal: toNumber(row.equality_total),
    financialReportsActive: toNumber(row.financial_reports_active),
    financialReportsTotal: toNumber(row.financial_reports_total),
    linksActive: toNumber(row.links_active),
    linksTotal: toNumber(row.links_total),
    mediaTotal: toNumber(row.media_total),
    newsletterDeliveryPending: toNumber(row.newsletter_delivery_pending),
    newsletterDeliverySending: toNumber(row.newsletter_delivery_sending),
    newsletterSubscribersActive: toNumber(row.newsletter_subscribers_active),
    newsletterSubscribersTotal: toNumber(row.newsletter_subscribers_total),
    newslettersActive: toNumber(row.newsletters_active),
    newslettersTotal: toNumber(row.newsletters_total),
    pressActive: toNumber(row.press_active),
    pressTotal: toNumber(row.press_total),
    tagsTotal: toNumber(row.tags_total),
  }
}

async function getAdminDashboardData() {
  return Promise.all([
    getAdminAccessSummary(),
    getAdminDashboardMetrics(),
    db.query.aboutPageContent.findFirst({
      columns: {
        heroImage: true,
        heroVisible: true,
        updatedAt: true,
      },
    }),
    db.query.pressDossier.findFirst({
      columns: {
        pdfUrl: true,
        active: true,
        updatedAt: true,
      },
    }),
    db.query.carouselItems.findFirst({
      columns: {
        active: true,
        href: true,
        updatedAt: true,
      },
      orderBy: desc(carouselItems.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
    db.query.equalityDocuments.findFirst({
      columns: {
        active: true,
        updatedAt: true,
      },
      orderBy: desc(equalityDocuments.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
    db.query.newsletters.findFirst({
      columns: {
        monthKey: true,
        active: true,
        sentAt: true,
        lastDeliveryWorkerToken: true,
        updatedAt: true,
      },
      orderBy: desc(newsletters.updatedAt),
    }),
    db.query.pressArticles.findFirst({
      columns: {
        type: true,
        active: true,
        updatedAt: true,
      },
      orderBy: desc(pressArticles.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
    db.query.featuredLinks.findFirst({
      columns: {
        active: true,
        updatedAt: true,
      },
      orderBy: desc(featuredLinks.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
    db.query.tags.findFirst({
      columns: {
        slug: true,
        updatedAt: true,
      },
      orderBy: desc(tags.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            name: true,
          },
        },
      },
    }),
    db.query.mediaOutlets.findFirst({
      columns: {
        name: true,
        website: true,
        updatedAt: true,
      },
      orderBy: desc(mediaOutlets.updatedAt),
    }),
    db.query.financialReports.findFirst({
      columns: {
        active: true,
        updatedAt: true,
      },
      orderBy: desc(financialReports.updatedAt),
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
  ])
}

export async function getAdminDashboardSummary() {
  const [
    accessSummary,
    metrics,
    aboutItem,
    pressDossierItem,
    latestCarouselItem,
    latestEqualityDocument,
    latestNewsletter,
    latestPressArticle,
    latestFeaturedLink,
    latestTag,
    latestMediaOutlet,
    latestFinancialReport,
  ] = await getAdminDashboardData()

  const sections: Record<AdminSectionKey, AdminSectionSummary> = {
    access: {
      total: accessSummary.total,
      active: accessSummary.active,
    },
    carousel: {
      total: metrics.carouselTotal,
      active: metrics.carouselActive,
    },
    about: {
      active: null,
      statusLabel: !aboutItem?.heroImage
        ? 'Sin banner'
        : aboutItem.heroVisible
          ? 'Visible'
          : 'Oculto',
      statusColor: !aboutItem?.heroImage
        ? 'warning'
        : aboutItem.heroVisible
          ? 'success'
          : 'neutral',
    },
    equality: {
      total: metrics.equalityTotal,
      active: metrics.equalityActive,
    },
    newsletter: {
      total: metrics.newslettersTotal,
      active: metrics.newslettersActive,
    },
    press: {
      total: metrics.pressTotal,
      active: metrics.pressActive,
    },
    pressDossier: {
      active: null,
      statusLabel: !pressDossierItem?.pdfUrl
        ? 'Sin configurar'
        : pressDossierItem.active
          ? 'Activo'
          : 'Inactivo',
      statusColor: !pressDossierItem?.pdfUrl
        ? 'warning'
        : pressDossierItem.active
          ? 'success'
          : 'neutral',
    },
    links: {
      total: metrics.linksTotal,
      active: metrics.linksActive,
    },
    tags: {
      total: metrics.tagsTotal,
      active: null,
    },
    media: {
      total: metrics.mediaTotal,
      active: null,
    },
    financialReports: {
      total: metrics.financialReportsTotal,
      active: metrics.financialReportsActive,
    },
  }

  const pendingNewsletterDeliveries = metrics.newsletterDeliveryPending
  const subscriberActiveCount = metrics.newsletterSubscribersActive

  const attentionItems = [
    !aboutItem?.heroImage
      ? {
          sectionKey: 'about',
          title: 'Falta el banner de “Qué es CREUP”',
          description: 'La página pública no tiene ahora mismo una imagen principal configurada.',
          to: '/admin/about',
          actionLabel: 'Subir banner',
          tone: 'warning',
          priority: 100,
        }
      : null,
    aboutItem?.heroImage && !aboutItem.heroVisible
      ? {
          sectionKey: 'about',
          title: 'El banner principal está oculto',
          description: 'Hay imagen guardada, pero no se está mostrando en la web pública.',
          to: '/admin/about',
          actionLabel: 'Revisar banner',
          tone: 'neutral',
          priority: 65,
        }
      : null,
    metrics.carouselActive === 0
      ? {
          sectionKey: 'carousel',
          title: 'No hay slides activos en la portada',
          description:
            'La portada pierde visibilidad si el carrusel no tiene ningún elemento publicado.',
          to: '/admin/carousel',
          actionLabel: 'Actualizar carrusel',
          tone: 'warning',
          priority: 95,
        }
      : null,
    sections.press.active === 0
      ? {
          sectionKey: 'press',
          title: 'No hay piezas de prensa activas',
          description:
            'Si prensa es el flujo principal, conviene tener al menos una pieza publicada.',
          to: '/admin/press/create?type=press_release',
          actionLabel: 'Crear nota de prensa',
          tone: 'warning',
          priority: 92,
        }
      : null,
    pendingNewsletterDeliveries > 0 && subscriberActiveCount > 0
      ? {
          sectionKey: 'newsletter',
          title:
            pendingNewsletterDeliveries === 1
              ? 'Hay 1 newsletter pendiente de envío'
              : `Hay ${pendingNewsletterDeliveries} newsletters pendientes de envío`,
          description:
            subscriberActiveCount === 1
              ? 'Tienes 1 suscriptor activo esperando la próxima edición.'
              : `Tienes ${subscriberActiveCount} suscriptores activos esperando la próxima edición.`,
          to: '/admin/newsletter',
          actionLabel: 'Revisar newsletter',
          tone: 'warning',
          priority: 90,
        }
      : null,
    subscriberActiveCount === 0
      ? {
          sectionKey: 'newsletter',
          title: 'No hay suscriptores activos en la newsletter',
          description:
            'Si vas a usar envíos desde el panel, conviene revisar la base de suscripción.',
          to: '/admin/newsletter/subscribers',
          actionLabel: 'Ver suscriptores',
          tone: 'neutral',
          priority: 58,
        }
      : null,
    !pressDossierItem?.pdfUrl
      ? {
          sectionKey: 'pressDossier',
          title: 'Falta configurar el dossier de prensa',
          description: 'No hay PDF enlazado desde la navegación pública.',
          to: '/admin/press-dossier',
          actionLabel: 'Subir dossier',
          tone: 'warning',
          priority: 84,
        }
      : null,
    pressDossierItem?.pdfUrl && !pressDossierItem.active
      ? {
          sectionKey: 'pressDossier',
          title: 'El dossier de prensa está inactivo',
          description: 'El PDF existe, pero no se muestra desde el menú público.',
          to: '/admin/press-dossier',
          actionLabel: 'Activar dossier',
          tone: 'neutral',
          priority: 62,
        }
      : null,
    metrics.linksActive === 0
      ? {
          sectionKey: 'links',
          title: 'No hay enlaces destacados activos',
          description: 'La portada pierde accesos rápidos si no hay bloques destacados visibles.',
          to: '/admin/links',
          actionLabel: 'Revisar enlaces',
          tone: 'warning',
          priority: 72,
        }
      : null,
    metrics.equalityActive === 0
      ? {
          sectionKey: 'equality',
          title: 'No hay documentos activos en Igualdad',
          description: 'La sección pública quedará vacía si no hay ningún documento visible.',
          to: '/admin/equality',
          actionLabel: 'Añadir documento',
          tone: 'warning',
          priority: 68,
        }
      : null,
    metrics.financialReportsActive === 0
      ? {
          sectionKey: 'financialReports',
          title: 'No hay informes económicos activos',
          description: 'Puede ser buen momento para revisar si falta publicar el informe vigente.',
          to: '/admin/financial-reports',
          actionLabel: 'Revisar informes',
          tone: 'neutral',
          priority: 56,
        }
      : null,
    accessSummary.active <= 1
      ? {
          sectionKey: 'access',
          title: 'Solo hay un acceso activo al panel',
          description:
            'Mantener más de una persona con acceso reduce el riesgo de bloqueo operativo.',
          to: '/admin/access',
          actionLabel: 'Gestionar accesos',
          tone: 'neutral',
          priority: 50,
        }
      : null,
  ]
    .filter((item): item is DashboardAttentionItem & { priority: number } => item !== null)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 5)
    .map(({ priority: _priority, ...item }) => item)

  const recentActivityCandidates: Array<DashboardRecentActivityDraft | null> = [
    aboutItem?.updatedAt
      ? {
          sectionKey: 'about',
          title: 'Banner “Qué es CREUP”',
          description: !aboutItem.heroImage
            ? 'Sin banner configurado'
            : aboutItem.heroVisible
              ? 'Visible en la web pública'
              : 'Guardado, pero oculto',
          to: '/admin/about',
          updatedAt: aboutItem.updatedAt,
        }
      : null,
    latestCarouselItem?.updatedAt
      ? {
          sectionKey: 'carousel',
          title: getTranslatedValue(latestCarouselItem.translations, 'title', 'Slide sin título'),
          description: `${latestCarouselItem.active ? 'Activo' : 'Inactivo'} · ${latestCarouselItem.href}`,
          to: '/admin/carousel',
          updatedAt: latestCarouselItem.updatedAt,
        }
      : null,
    latestEqualityDocument?.updatedAt
      ? {
          sectionKey: 'equality',
          title: getTranslatedValue(
            latestEqualityDocument.translations,
            'title',
            'Documento de igualdad'
          ),
          description: latestEqualityDocument.active ? 'Documento activo' : 'Documento inactivo',
          to: '/admin/equality',
          updatedAt: latestEqualityDocument.updatedAt,
        }
      : null,
    latestNewsletter?.updatedAt
      ? {
          sectionKey: 'newsletter',
          title: `Newsletter ${formatNewsletterMonth(latestNewsletter.monthKey)}`,
          description: latestNewsletter.lastDeliveryWorkerToken
            ? 'Enviándose ahora'
            : latestNewsletter.sentAt
              ? 'Ya enviada'
              : latestNewsletter.active
                ? 'Pendiente de envío'
                : 'Guardada como inactiva',
          to: '/admin/newsletter',
          updatedAt: latestNewsletter.updatedAt,
        }
      : null,
    latestPressArticle?.updatedAt
      ? {
          sectionKey: 'press',
          title: getTranslatedValue(latestPressArticle.translations, 'title', 'Artículo de prensa'),
          description: `${pressTypeLabelsByKey[latestPressArticle.type] ?? 'Prensa'} · ${latestPressArticle.active ? 'Activo' : 'Inactivo'}`,
          to: '/admin/press',
          updatedAt: latestPressArticle.updatedAt,
        }
      : null,
    pressDossierItem?.updatedAt
      ? {
          sectionKey: 'pressDossier',
          title: 'Dossier de prensa',
          description: !pressDossierItem.pdfUrl
            ? 'Sin PDF configurado'
            : pressDossierItem.active
              ? 'PDF activo'
              : 'PDF guardado pero inactivo',
          to: '/admin/press-dossier',
          updatedAt: pressDossierItem.updatedAt,
        }
      : null,
    latestFeaturedLink?.updatedAt
      ? {
          sectionKey: 'links',
          title: getTranslatedValue(latestFeaturedLink.translations, 'title', 'Enlace destacado'),
          description: latestFeaturedLink.active ? 'Bloque activo' : 'Bloque inactivo',
          to: '/admin/links',
          updatedAt: latestFeaturedLink.updatedAt,
        }
      : null,
    latestTag?.updatedAt
      ? {
          sectionKey: 'tags',
          title: getTranslatedValue(latestTag.translations, 'name', latestTag.slug),
          description: `Etiqueta · ${latestTag.slug}`,
          to: '/admin/tags',
          updatedAt: latestTag.updatedAt,
        }
      : null,
    latestMediaOutlet?.updatedAt
      ? {
          sectionKey: 'media',
          title: latestMediaOutlet.name,
          description: latestMediaOutlet.website,
          to: '/admin/media',
          updatedAt: latestMediaOutlet.updatedAt,
        }
      : null,
    latestFinancialReport?.updatedAt
      ? {
          sectionKey: 'financialReports',
          title: getTranslatedValue(
            latestFinancialReport.translations,
            'title',
            'Informe económico'
          ),
          description: latestFinancialReport.active ? 'Informe activo' : 'Informe inactivo',
          to: '/admin/financial-reports',
          updatedAt: latestFinancialReport.updatedAt,
        }
      : null,
  ]

  const recentActivity = recentActivityCandidates
    .filter(isDefined)
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 8)
    .map(
      (item): DashboardRecentActivityItem => ({
        ...item,
        updatedAt: item.updatedAt.toISOString(),
      })
    )

  return {
    sections,
    subscribers: {
      total: metrics.newsletterSubscribersTotal,
      active: subscriberActiveCount,
    },
    newsletterDelivery: {
      pending: pendingNewsletterDeliveries,
      sending: metrics.newsletterDeliverySending,
    },
    attentionItems,
    recentActivity,
  }
}
