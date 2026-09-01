import type { H3Event } from 'h3'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import type { AdminSectionKey } from '~~/shared/constants/adminSections'
import { getRequestLocaleContext } from '../locale/requestLocale'
import {
  PRESS_TYPE_LABELS_BY_LOCALE,
  resolveSummaryLocale,
  SUMMARY_LABELS,
  NEWSLETTER_CAMPAIGN_STATUS_LABEL_KEYS,
} from './adminSummaryLabels'
import type { TranslationLike } from './adminSummaryHelpers'
import { getTranslatedValue, isDefined } from './adminSummaryHelpers'
import { getAdminDashboardData } from './adminSummaryData'

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

export async function getAdminDashboardSummary(event: H3Event) {
  const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
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
    latestNewsletterCampaign,
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
    latestNewsletterCampaign?.updatedAt
      ? {
          sectionKey: 'newsletter',
          title: latestNewsletterCampaign.subject || t('newsletterUntitled'),
          description: t(
            NEWSLETTER_CAMPAIGN_STATUS_LABEL_KEYS[latestNewsletterCampaign.status] ??
              'newsletterStatusDraft'
          ),
          to: ADMIN_ROUTES.newsletter,
          updatedAt: latestNewsletterCampaign.updatedAt,
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
