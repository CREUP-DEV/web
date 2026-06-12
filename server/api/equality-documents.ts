import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { equalityDocuments } from '../db/schema'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { pickLocalizedEntryWithFieldFallback } from '~~/shared/utils/locale'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { appendAssetVersion } from '../utils/core/assetVersion'
import { definePublicPaginatedListHandler } from '../utils/public/definePublicPaginatedListHandler'

const activeWhere = eq(equalityDocuments.active, true)

export default definePublicPaginatedListHandler({
  table: equalityDocuments,
  activeWhere,
  cacheScope: 'public-equality-documents',
  errorScope: 'public.equality-documents',
  fetchPage: ({ limit, offset }) =>
    db.query.equalityDocuments.findMany({
      where: activeWhere,
      orderBy: [asc(equalityDocuments.order), asc(equalityDocuments.id)],
      limit,
      offset,
      with: {
        translations: {
          columns: {
            locale: true,
            title: true,
            description: true,
            meta: true,
          },
        },
      },
    }),
  mapItem: (item, { locale, locales, fallbackLocale }) => {
    const translation = pickLocalizedEntryWithFieldFallback(
      item.translations,
      locale,
      locales,
      fallbackLocale
    )

    return {
      id: item.id,
      title: translation?.title ?? '',
      description: translation?.description ?? '',
      meta: translation?.meta ?? '',
      pdfUrl: appendAssetVersion(
        toExternalPdfProxyUrl(item.pdfUrl, {
          publicPathBase: EQUALITY_DOCUMENTS_PUBLIC_PATH,
        }) ?? item.pdfUrl,
        item.updatedAt
      ),
    }
  },
})
