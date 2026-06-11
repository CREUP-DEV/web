import { sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { PRESS_TYPE_LABELS, type PressArticleType } from '~~/shared/constants/pressTypes'
import type { AdminSectionKey } from '~~/shared/constants/adminSections'
import type { LocaleDefinition } from '~~/shared/utils/locale'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { db } from '../../db'
import { getRequestLocaleContext } from '../locale/requestLocale'

type SummaryLocale = 'es' | 'en' | 'ca' | 'eu'

const summaryLabelsEs = {
  aboutBannerTitle: 'Banner “Qué es CREUP”',
  aboutNoBanner: 'Sin banner configurado',
  aboutVisible: 'Visible en la web pública',
  aboutSavedHidden: 'Guardado, pero oculto',
  carouselUntitled: 'Slide sin título',
  statusActive: 'Activo',
  statusInactive: 'Inactivo',
  equalityFallback: 'Documento de igualdad',
  equalityActive: 'Documento activo',
  equalityInactive: 'Documento inactivo',
  newsletterPrefix: 'Newsletter',
  newsletterSendingNow: 'Enviándose ahora',
  newsletterSent: 'Ya enviada',
  newsletterPending: 'Pendiente de envío',
  newsletterVisibleWeb: 'visible en web',
  newsletterHiddenWeb: 'oculta en web',
  pressFallback: 'Artículo de prensa',
  pressTypeFallback: 'Prensa',
  pressDossierTitle: 'Dossier de prensa',
  pressDossierNoPdf: 'Sin PDF configurado',
  pressDossierActive: 'PDF activo',
  pressDossierInactive: 'PDF guardado pero inactivo',
  linksFallback: 'Enlace destacado',
  linksActive: 'Bloque activo',
  linksInactive: 'Bloque inactivo',
  tagPrefix: 'Etiqueta',
  financialFallback: 'Informe económico',
  financialActive: 'Informe activo',
  financialInactive: 'Informe inactivo',
}

type SummaryLabelKey = keyof typeof summaryLabelsEs

const SUMMARY_LABELS: Record<SummaryLocale, Record<string, string>> = {
  es: summaryLabelsEs,
  en: {
    aboutBannerTitle: '“What is CREUP” banner',
    aboutNoBanner: 'No banner configured',
    aboutVisible: 'Visible on the public website',
    aboutSavedHidden: 'Saved, but hidden',
    carouselUntitled: 'Untitled slide',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    equalityFallback: 'Equality document',
    equalityActive: 'Active document',
    equalityInactive: 'Inactive document',
    newsletterPrefix: 'Newsletter',
    newsletterSendingNow: 'Sending now',
    newsletterSent: 'Already sent',
    newsletterPending: 'Pending delivery',
    newsletterVisibleWeb: 'visible on web',
    newsletterHiddenWeb: 'hidden on web',
    pressFallback: 'Press article',
    pressTypeFallback: 'Press',
    pressDossierTitle: 'Press dossier',
    pressDossierNoPdf: 'No PDF configured',
    pressDossierActive: 'Active PDF',
    pressDossierInactive: 'PDF saved but inactive',
    linksFallback: 'Featured link',
    linksActive: 'Active block',
    linksInactive: 'Inactive block',
    tagPrefix: 'Tag',
    financialFallback: 'Economic report',
    financialActive: 'Active report',
    financialInactive: 'Inactive report',
  } satisfies Record<SummaryLabelKey, string>,
  ca: {
    aboutBannerTitle: 'Bàner “Què és CREUP”',
    aboutNoBanner: 'Sense bàner configurat',
    aboutVisible: 'Visible al web públic',
    aboutSavedHidden: 'Desat, però ocult',
    carouselUntitled: 'Diapositiva sense títol',
    statusActive: 'Actiu',
    statusInactive: 'Inactiu',
    equalityFallback: "Document d'igualtat",
    equalityActive: 'Document actiu',
    equalityInactive: 'Document inactiu',
    newsletterPrefix: 'Newsletter',
    newsletterSendingNow: "S'està enviant ara",
    newsletterSent: 'Ja enviat',
    newsletterPending: "Pendent d'enviament",
    newsletterVisibleWeb: 'visible al web',
    newsletterHiddenWeb: 'ocult al web',
    pressFallback: 'Article de premsa',
    pressTypeFallback: 'Premsa',
    pressDossierTitle: 'Dossier de premsa',
    pressDossierNoPdf: 'Sense PDF configurat',
    pressDossierActive: 'PDF actiu',
    pressDossierInactive: 'PDF desat però inactiu',
    linksFallback: 'Enllaç destacat',
    linksActive: 'Bloc actiu',
    linksInactive: 'Bloc inactiu',
    tagPrefix: 'Etiqueta',
    financialFallback: 'Informe econòmic',
    financialActive: 'Informe actiu',
    financialInactive: 'Informe inactiu',
  } satisfies Record<SummaryLabelKey, string>,
  eu: {
    aboutBannerTitle: '“Zer da CREUP” banner-a',
    aboutNoBanner: 'Banner-ik konfiguratu gabe',
    aboutVisible: 'Web publikoan ikusgai',
    aboutSavedHidden: 'Gordeta, baina ezkutatuta',
    carouselUntitled: 'Izenbururik gabeko diapositiba',
    statusActive: 'Aktibo',
    statusInactive: 'Inaktibo',
    equalityFallback: 'Berdintasun-dokumentua',
    equalityActive: 'Dokumentu aktiboa',
    equalityInactive: 'Dokumentu inaktiboa',
    newsletterPrefix: 'Newsletter',
    newsletterSendingNow: 'Orain bidaltzen',
    newsletterSent: 'Dagoeneko bidalita',
    newsletterPending: 'Bidaltzeke',
    newsletterVisibleWeb: 'webean ikusgai',
    newsletterHiddenWeb: 'webean ezkutatuta',
    pressFallback: 'Prentsa-artikulua',
    pressTypeFallback: 'Prentsa',
    pressDossierTitle: 'Prentsa-dosierra',
    pressDossierNoPdf: 'PDFrik konfiguratu gabe',
    pressDossierActive: 'PDF aktiboa',
    pressDossierInactive: 'PDFa gordeta baina inaktibo',
    linksFallback: 'Esteka nabarmendua',
    linksActive: 'Bloke aktiboa',
    linksInactive: 'Bloke inaktiboa',
    tagPrefix: 'Etiketa',
    financialFallback: 'Txosten ekonomikoa',
    financialActive: 'Txosten aktiboa',
    financialInactive: 'Txosten inaktiboa',
  } satisfies Record<SummaryLabelKey, string>,
}

const resolveSummaryLocale = (locale: string): SummaryLocale =>
  locale === 'en' || locale === 'ca' || locale === 'eu' ? locale : 'es'

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

type ParsedTranslation<K extends string> = { locale: string } & Record<K, string | null>

// Localized press-type labels for the activity feed (PRESS_TYPE_LABELS itself is es-only).
// es reuses that constant; en/ca/eu mirror the i18n locale conventions.
const PRESS_TYPE_LABELS_BY_LOCALE: Record<SummaryLocale, Record<PressArticleType, string>> = {
  es: PRESS_TYPE_LABELS,
  en: {
    press_release: 'Press release',
    statement: 'Statement',
    media_appearance: 'Media appearance',
  },
  ca: {
    press_release: 'Nota de premsa',
    statement: 'Comunicat',
    media_appearance: 'Aparició als mitjans',
  },
  eu: {
    press_release: 'Prentsa-oharra',
    statement: 'Adierazpena',
    media_appearance: 'Hedabideetako agerpena',
  },
}

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

const parseTranslations = <K extends string>(value: unknown, key: K): ParsedTranslation<K>[] =>
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
      } as ParsedTranslation<K>
    })
    .filter((entry): entry is ParsedTranslation<K> => entry !== null)

const getTranslatedValue = <T extends TranslationLike>(
  translations: T[] | undefined,
  key: Exclude<keyof T, 'locale'>,
  fallback: string,
  locale: string,
  locales: LocaleDefinition[],
  fallbackLocale: string
) => {
  if (!translations?.length) {
    return fallback
  }

  const normalizedKey = String(key)
  const preferredTranslation = pickLocalizedEntry(translations, locale, locales, fallbackLocale)
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

const formatNewsletterMonth = (monthKey: string, languageTag: string) => {
  const label = new Intl.DateTimeFormat(languageTag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`))

  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface AdminDashboardMetrics {
  newsletterSubscribersActive: number
  newsletterSubscribersTotal: number
}

async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const result = await db.execute(sql`
    select
      (select count(*)::int from newsletter_subscribers) as newsletter_subscribers_total,
      (select coalesce(sum(case when active then 1 else 0 end), 0)::int from newsletter_subscribers) as newsletter_subscribers_active
  `)

  const row = (result.rows?.[0] ?? {}) as Record<string, unknown>

  return {
    newsletterSubscribersActive: toNumber(row.newsletter_subscribers_active),
    newsletterSubscribersTotal: toNumber(row.newsletter_subscribers_total),
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
  return Promise.all([getAdminDashboardMetrics(), getAdminDashboardLatestData()])
}

export async function getAdminDashboardSummary(event: H3Event) {
  const { locale, locales, fallbackLocale, languageTag } = getRequestLocaleContext(event)
  const summaryLocale = resolveSummaryLocale(locale)
  const t = (key: string) => SUMMARY_LABELS[summaryLocale][key] ?? key
  const getActivityTitle = <T extends TranslationLike>(
    translations: T[] | undefined,
    key: Exclude<keyof T, 'locale'>,
    fallback: string
  ) => getTranslatedValue(translations, key, fallback, locale, locales, fallbackLocale)

  const [metrics, latestData] = await getAdminDashboardData()

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

  const subscriberActiveCount = metrics.newsletterSubscribersActive

  const recentActivityCandidates: Array<DashboardRecentActivityDraft | null> = [
    aboutItem?.updatedAt
      ? {
          sectionKey: 'about',
          title: t('aboutBannerTitle'),
          description: !aboutItem.heroImage
            ? t('aboutNoBanner')
            : aboutItem.heroVisible
              ? t('aboutVisible')
              : t('aboutSavedHidden'),
          to: ADMIN_ROUTES.about,
          updatedAt: aboutItem.updatedAt,
        }
      : null,
    latestCarouselItem?.updatedAt
      ? {
          sectionKey: 'carousel',
          title: getActivityTitle(latestCarouselItem.translations, 'title', t('carouselUntitled')),
          description: `${latestCarouselItem.active ? t('statusActive') : t('statusInactive')} · ${latestCarouselItem.href}`,
          to: ADMIN_ROUTES.carousel,
          updatedAt: latestCarouselItem.updatedAt,
        }
      : null,
    latestEqualityDocument?.updatedAt
      ? {
          sectionKey: 'equality',
          title: getActivityTitle(
            latestEqualityDocument.translations,
            'title',
            t('equalityFallback')
          ),
          description: latestEqualityDocument.active ? t('equalityActive') : t('equalityInactive'),
          to: ADMIN_ROUTES.equality,
          updatedAt: latestEqualityDocument.updatedAt,
        }
      : null,
    latestNewsletter?.updatedAt
      ? {
          sectionKey: 'newsletter',
          title: `${t('newsletterPrefix')} ${formatNewsletterMonth(latestNewsletter.monthKey, languageTag)}`,
          description: latestNewsletter.lastDeliveryWorkerToken
            ? `${t('newsletterSendingNow')} · ${latestNewsletter.publicVisible ? t('newsletterVisibleWeb') : t('newsletterHiddenWeb')}`
            : latestNewsletter.sentAt
              ? `${t('newsletterSent')} · ${latestNewsletter.publicVisible ? t('newsletterVisibleWeb') : t('newsletterHiddenWeb')}`
              : `${t('newsletterPending')} · ${latestNewsletter.publicVisible ? t('newsletterVisibleWeb') : t('newsletterHiddenWeb')}`,
          to: ADMIN_ROUTES.newsletter,
          updatedAt: latestNewsletter.updatedAt,
        }
      : null,
    latestPressArticle?.updatedAt
      ? {
          sectionKey: 'press',
          title: getActivityTitle(latestPressArticle.translations, 'title', t('pressFallback')),
          description: `${(PRESS_TYPE_LABELS_BY_LOCALE[summaryLocale] as Record<string, string>)[latestPressArticle.type] ?? t('pressTypeFallback')} · ${latestPressArticle.active ? t('statusActive') : t('statusInactive')}`,
          to: ADMIN_ROUTES.press,
          updatedAt: latestPressArticle.updatedAt,
        }
      : null,
    pressDossierItem?.updatedAt
      ? {
          sectionKey: 'pressDossier',
          title: t('pressDossierTitle'),
          description: !pressDossierItem.pdfUrl
            ? t('pressDossierNoPdf')
            : pressDossierItem.active
              ? t('pressDossierActive')
              : t('pressDossierInactive'),
          to: ADMIN_ROUTES.pressDossier,
          updatedAt: pressDossierItem.updatedAt,
        }
      : null,
    latestFeaturedLink?.updatedAt
      ? {
          sectionKey: 'links',
          title: getActivityTitle(latestFeaturedLink.translations, 'title', t('linksFallback')),
          description: latestFeaturedLink.active ? t('linksActive') : t('linksInactive'),
          to: ADMIN_ROUTES.links,
          updatedAt: latestFeaturedLink.updatedAt,
        }
      : null,
    latestTag?.updatedAt
      ? {
          sectionKey: 'tags',
          title: getActivityTitle(latestTag.translations, 'name', latestTag.slug),
          description: `${t('tagPrefix')} · ${latestTag.slug}`,
          to: ADMIN_ROUTES.tags,
          updatedAt: latestTag.updatedAt,
        }
      : null,
    latestMediaOutlet?.updatedAt
      ? {
          sectionKey: 'media',
          title: latestMediaOutlet.name,
          description: latestMediaOutlet.website,
          to: ADMIN_ROUTES.media,
          updatedAt: latestMediaOutlet.updatedAt,
        }
      : null,
    latestFinancialReport?.updatedAt
      ? {
          sectionKey: 'financialReports',
          title: getActivityTitle(
            latestFinancialReport.translations,
            'title',
            t('financialFallback')
          ),
          description: latestFinancialReport.active ? t('financialActive') : t('financialInactive'),
          to: ADMIN_ROUTES.financialReports,
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
    subscribers: {
      total: metrics.newsletterSubscribersTotal,
      active: subscriberActiveCount,
    },
    recentActivity,
  }
}
