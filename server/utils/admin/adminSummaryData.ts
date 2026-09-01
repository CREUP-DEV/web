import { sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  parseTranslations,
  toBooleanOrNull,
  toDateOrNull,
  toNumber,
  toStringOrNull,
} from './adminSummaryHelpers'
import type { NewsletterCampaignStatus } from '~~/shared/constants/newsletterCampaigns'

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

export interface AdminDashboardLatestData {
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
  latestNewsletterCampaign: {
    status: NewsletterCampaignStatus
    subject: string
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
        c.id::text as entity_id,
        c.updated_at,
        jsonb_build_object(
          'status', c.status,
          'subject', (
            select ct.subject
            from newsletter_campaign_translations ct
            where ct.campaign_id = c.id
            order by (ct.locale = 'es') desc, ct.locale
            limit 1
          )
        ) as payload
      from newsletter_campaigns c

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

      (newsletter.payload ->> 'status') as newsletter_status,
      (newsletter.payload ->> 'subject') as newsletter_subject,
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
    latestNewsletterCampaign: newsletterUpdatedAt
      ? {
          status: (toStringOrNull(row.newsletter_status) ?? 'draft') as NewsletterCampaignStatus,
          subject: toStringOrNull(row.newsletter_subject) ?? '',
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

export async function getAdminDashboardData() {
  return Promise.all([getAdminDashboardMetrics(), getAdminDashboardLatestData()])
}
