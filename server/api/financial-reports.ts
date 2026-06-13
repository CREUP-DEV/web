import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { financialReports } from '../db/schema'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { appendAssetVersion } from '../utils/core/assetVersion'
import { definePublicPaginatedListHandler } from '../utils/public/definePublicPaginatedListHandler'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const activeWhere = eq(financialReports.active, true)

export default definePublicPaginatedListHandler({
  table: financialReports,
  activeWhere,
  cacheScope: 'public-financial-reports',
  errorScope: 'public.financial-reports',
  fetchPage: ({ limit, offset }) =>
    db.query.financialReports.findMany({
      where: activeWhere,
      orderBy: [desc(financialReports.approvedAt), desc(financialReports.id)],
      limit,
      offset,
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
          },
        },
      },
    }),
  mapItem: (item, { locale, locales, fallbackLocale }) => ({
    id: item.id,
    title: pickLocalizedEntry(item.translations, locale, locales, fallbackLocale)?.title ?? '',
    pdfUrl: appendAssetVersion(
      toExternalPdfProxyUrl(item.pdfUrl, {
        publicPathBase: FINANCIAL_REPORTS_PUBLIC_PATH,
      }) ?? item.pdfUrl,
      item.updatedAt
    ),
    approvedAt: dateValueToDateOnly(item.approvedAt),
  }),
})
