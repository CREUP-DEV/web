import { sql } from 'drizzle-orm'
import { PRESS_TYPE_LABELS } from '~~/shared/constants/pressTypes'
import type { AdminSectionKey } from '~~/shared/constants/adminSections'
import { DEFAULT_LOCALE_CODE } from '~~/shared/utils/locale'
import { db } from '../db'
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
const toStringOrNull = (value: unknown) => (typeof value === 'string' ? value : null)
const toBooleanOrNull = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (value == null) {
    return null
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') {
    return true
  }
  if (normalized === 'false') {
    return false
  }

  return null
}
const toDateOrNull = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

const parseJsonArray = (value: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry)
    )
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      )
    } catch {
      return []
    }
  }

  return []
}

const parseTranslations = <K extends string>(
  value: unknown,
  key: K
): Array<{ locale: string; [P in K]: string | null }> =>
  parseJsonArray(value)
    .map((entry) => {
      const locale = toStringOrNull(entry.locale)
      if (!locale) {
        return null
      }

      const rawValue = entry[key]
      return {
        locale,
        [key]: typeof rawValue === 'string' ? rawValue : null,
      } as { locale: string; [P in K]: string | null }
    })
    .filter((entry): entry is { locale: string; [P in K]: string | null } => entry !== null)

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

interface AdminDashboardLatestData {
  aboutItem: {
    heroImage: string | null
    heroVisible: boolean
    updatedAt: Date
  } | null
  latestCarouselItem: {
    active: boolean
    href: string
    updatedAt: Date
    translations: Array<{ locale: string; title: string | null }>
  } | null
  latestEqualityDocument: {
    active: boolean
    updatedAt: Date
    translations: Array<{ locale: string; title: string | null }>
  } | null
  latestFeaturedLink: {
    active: boolean
    updatedAt: Date
    translations: Array<{ locale: string; title: string | null }>
  } | null
  latestFinancialReport: {
    active: boolean
    updatedAt: Date
    translations: Array<{ locale: string; title: string | null }>
  } | null
  latestMediaOutlet: {
    name: string
    website: string
    updatedAt: Date
  } | null
  latestNewsletter: {
    monthKey: string
    active: boolean
    publicVisible: boolean
    sentAt: Date | null
    lastDeliveryWorkerToken: string | null
    updatedAt: Date
  } | null
  latestPressArticle: {
    type: string
    active: boolean
    updatedAt: Date
    translations: Array<{ locale: string; title: string | null }>
  } | null
  latestTag: {
    slug: string
    updatedAt: Date
    translations: Array<{ locale: string; name: string | null }>
  } | null
  pressDossierItem: {
    pdfUrl: string | null
    active: boolean
    updatedAt: Date
  } | null
}

async function getAdminDashboardLatestData(): Promise<AdminDashboardLatestData> {
  const result = await db.execute(sql`
    with latest_candidates as (
      select
        'about'::text as section_key,
        apc.id::text as entity_id,
        apc.updated_at,
        jsonb_build_object(
          'heroImage', apc.hero_image,
          'heroVisible', apc.hero_visible
        ) as payload
      from about_page_content apc

      union all

      select
        'pressDossier'::text as section_key,
        pd.id::text as entity_id,
        pd.updated_at,
        jsonb_build_object(
          'pdfUrl', pd.pdf_url,
          'active', pd.active
        ) as payload
      from press_dossier pd

      union all

      select
        'carousel'::text as section_key,
        ci.id::text as entity_id,
        ci.updated_at,
        jsonb_build_object(
          'active', ci.active,
          'href', ci.href
        ) as payload
      from carousel_items ci

      union all

      select
        'equality'::text as section_key,
        ed.id::text as entity_id,
        ed.updated_at,
        jsonb_build_object('active', ed.active) as payload
      from equality_documents ed

      union all

      select
        'newsletter'::text as section_key,
        n.id::text as entity_id,
        n.updated_at,
        jsonb_build_object(
          'monthKey', n.month_key,
          'active', n.active,
          'publicVisible', n.public_visible,
          'sentAt', n.sent_at,
          'lastDeliveryWorkerToken', n.last_delivery_worker_token
        ) as payload
      from newsletters n

      union all

      select
        'press'::text as section_key,
        pa.id::text as entity_id,
        pa.updated_at,
        jsonb_build_object(
          'type', pa.type,
          'active', pa.active
        ) as payload
      from press_articles pa

      union all

      select
        'links'::text as section_key,
        fl.id::text as entity_id,
        fl.updated_at,
        jsonb_build_object('active', fl.active) as payload
      from featured_links fl

      union all

      select
        'tags'::text as section_key,
        t.id::text as entity_id,
        t.updated_at,
        jsonb_build_object('slug', t.slug) as payload
      from tags t

      union all

      select
        'media'::text as section_key,
        mo.id::text as entity_id,
        mo.updated_at,
        jsonb_build_object(
          'name', mo.name,
          'website', mo.website
        ) as payload
      from media_outlets mo

      union all

      select
        'financialReports'::text as section_key,
        fr.id::text as entity_id,
        fr.updated_at,
        jsonb_build_object('active', fr.active) as payload
      from financial_reports fr
    ),
    latest as (
      select section_key, entity_id, updated_at, payload
      from (
        select
          section_key,
          entity_id,
          updated_at,
          payload,
          row_number() over (
            partition by section_key
            order by updated_at desc, entity_id desc
          ) as rn
        from latest_candidates
      ) ranked
      where rn = 1
    )
    select
      (about.payload ->> 'heroImage') as about_hero_image,
      (about.payload ->> 'heroVisible')::boolean as about_hero_visible,
      about.updated_at as about_updated_at,

      (press_dossier.payload ->> 'pdfUrl') as press_dossier_pdf_url,
      (press_dossier.payload ->> 'active')::boolean as press_dossier_active,
      press_dossier.updated_at as press_dossier_updated_at,

      (carousel.payload ->> 'active')::boolean as carousel_active,
      (carousel.payload ->> 'href') as carousel_href,
      carousel.updated_at as carousel_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', cit.locale,
              'title', cit.title
            )
            order by cit.locale
          ),
          '[]'::jsonb
        )
        from carousel_item_translations cit
        where cit.carousel_item_id = carousel.entity_id
      ) as carousel_translations,

      (equality.payload ->> 'active')::boolean as equality_active,
      equality.updated_at as equality_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', edt.locale,
              'title', edt.title
            )
            order by edt.locale
          ),
          '[]'::jsonb
        )
        from equality_document_translations edt
        where edt.equality_document_id = equality.entity_id
      ) as equality_translations,

      (newsletter.payload ->> 'monthKey') as newsletter_month_key,
      (newsletter.payload ->> 'active')::boolean as newsletter_active,
      (newsletter.payload ->> 'publicVisible')::boolean as newsletter_public_visible,
      (newsletter.payload ->> 'sentAt')::timestamptz as newsletter_sent_at,
      (newsletter.payload ->> 'lastDeliveryWorkerToken') as newsletter_last_delivery_worker_token,
      newsletter.updated_at as newsletter_updated_at,

      (press.payload ->> 'type') as press_type,
      (press.payload ->> 'active')::boolean as press_active,
      press.updated_at as press_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', pat.locale,
              'title', pat.title
            )
            order by pat.locale
          ),
          '[]'::jsonb
        )
        from press_article_translations pat
        where pat.press_article_id = press.entity_id
      ) as press_translations,

      (links.payload ->> 'active')::boolean as links_active,
      links.updated_at as links_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', flt.locale,
              'title', flt.title
            )
            order by flt.locale
          ),
          '[]'::jsonb
        )
        from featured_link_translations flt
        where flt.featured_link_id = links.entity_id
      ) as links_translations,

      (tag_item.payload ->> 'slug') as tag_slug,
      tag_item.updated_at as tag_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', tt.locale,
              'name', tt.name
            )
            order by tt.locale
          ),
          '[]'::jsonb
        )
        from tag_translations tt
        where tt.tag_id = tag_item.entity_id
      ) as tag_translations,

      (media.payload ->> 'name') as media_name,
      (media.payload ->> 'website') as media_website,
      media.updated_at as media_updated_at,

      (financial_reports.payload ->> 'active')::boolean as financial_reports_active,
      financial_reports.updated_at as financial_reports_updated_at,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'locale', frt.locale,
              'title', frt.title
            )
            order by frt.locale
          ),
          '[]'::jsonb
        )
        from financial_report_translations frt
        where frt.financial_report_id = financial_reports.entity_id
      ) as financial_reports_translations
    from (select 1 as singleton_marker) singleton
    left join latest about on about.section_key = 'about'
    left join latest press_dossier on press_dossier.section_key = 'pressDossier'
    left join latest carousel on carousel.section_key = 'carousel'
    left join latest equality on equality.section_key = 'equality'
    left join latest newsletter on newsletter.section_key = 'newsletter'
    left join latest press on press.section_key = 'press'
    left join latest links on links.section_key = 'links'
    left join latest tag_item on tag_item.section_key = 'tags'
    left join latest media on media.section_key = 'media'
    left join latest financial_reports on financial_reports.section_key = 'financialReports'
  `)

  const row = (result.rows?.[0] ?? {}) as Record<string, unknown>

  const aboutUpdatedAt = toDateOrNull(row.about_updated_at)
  const pressDossierUpdatedAt = toDateOrNull(row.press_dossier_updated_at)
  const carouselUpdatedAt = toDateOrNull(row.carousel_updated_at)
  const equalityUpdatedAt = toDateOrNull(row.equality_updated_at)
  const newsletterUpdatedAt = toDateOrNull(row.newsletter_updated_at)
  const pressUpdatedAt = toDateOrNull(row.press_updated_at)
  const linksUpdatedAt = toDateOrNull(row.links_updated_at)
  const tagUpdatedAt = toDateOrNull(row.tag_updated_at)
  const mediaUpdatedAt = toDateOrNull(row.media_updated_at)
  const financialReportsUpdatedAt = toDateOrNull(row.financial_reports_updated_at)

  return {
    aboutItem: aboutUpdatedAt
      ? {
          heroImage: toStringOrNull(row.about_hero_image),
          heroVisible: toBooleanOrNull(row.about_hero_visible) ?? false,
          updatedAt: aboutUpdatedAt,
        }
      : null,
    pressDossierItem: pressDossierUpdatedAt
      ? {
          pdfUrl: toStringOrNull(row.press_dossier_pdf_url),
          active: toBooleanOrNull(row.press_dossier_active) ?? false,
          updatedAt: pressDossierUpdatedAt,
        }
      : null,
    latestCarouselItem: carouselUpdatedAt
      ? {
          active: toBooleanOrNull(row.carousel_active) ?? false,
          href: toStringOrNull(row.carousel_href) ?? '',
          updatedAt: carouselUpdatedAt,
          translations: parseTranslations(row.carousel_translations, 'title'),
        }
      : null,
    latestEqualityDocument: equalityUpdatedAt
      ? {
          active: toBooleanOrNull(row.equality_active) ?? false,
          updatedAt: equalityUpdatedAt,
          translations: parseTranslations(row.equality_translations, 'title'),
        }
      : null,
    latestNewsletter: newsletterUpdatedAt
      ? {
          monthKey: toStringOrNull(row.newsletter_month_key) ?? '',
          active: toBooleanOrNull(row.newsletter_active) ?? false,
          publicVisible: toBooleanOrNull(row.newsletter_public_visible) ?? false,
          sentAt: toDateOrNull(row.newsletter_sent_at),
          lastDeliveryWorkerToken: toStringOrNull(row.newsletter_last_delivery_worker_token),
          updatedAt: newsletterUpdatedAt,
        }
      : null,
    latestPressArticle: pressUpdatedAt
      ? {
          type: toStringOrNull(row.press_type) ?? 'press_release',
          active: toBooleanOrNull(row.press_active) ?? false,
          updatedAt: pressUpdatedAt,
          translations: parseTranslations(row.press_translations, 'title'),
        }
      : null,
    latestFeaturedLink: linksUpdatedAt
      ? {
          active: toBooleanOrNull(row.links_active) ?? false,
          updatedAt: linksUpdatedAt,
          translations: parseTranslations(row.links_translations, 'title'),
        }
      : null,
    latestTag: tagUpdatedAt
      ? {
          slug: toStringOrNull(row.tag_slug) ?? '',
          updatedAt: tagUpdatedAt,
          translations: parseTranslations(row.tag_translations, 'name'),
        }
      : null,
    latestMediaOutlet: mediaUpdatedAt
      ? {
          name: toStringOrNull(row.media_name) ?? '',
          website: toStringOrNull(row.media_website) ?? '',
          updatedAt: mediaUpdatedAt,
        }
      : null,
    latestFinancialReport: financialReportsUpdatedAt
      ? {
          active: toBooleanOrNull(row.financial_reports_active) ?? false,
          updatedAt: financialReportsUpdatedAt,
          translations: parseTranslations(row.financial_reports_translations, 'title'),
        }
      : null,
  }
}

async function getAdminDashboardData() {
  return Promise.all([
    getAdminAccessSummary(),
    getAdminDashboardMetrics(),
    getAdminDashboardLatestData(),
  ])
}

export async function getAdminDashboardSummary() {
  const [accessSummary, metrics, latestData] = await getAdminDashboardData()

  const {
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
  } = latestData

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
            ? `Enviándose ahora · ${latestNewsletter.publicVisible ? 'visible en web' : 'oculta en web'}`
            : latestNewsletter.sentAt
              ? `Ya enviada · ${latestNewsletter.publicVisible ? 'visible en web' : 'oculta en web'}`
              : `${latestNewsletter.active ? 'Envío habilitado' : 'Envío deshabilitado'} · ${
                  latestNewsletter.publicVisible ? 'visible en web' : 'oculta en web'
                }`,
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
