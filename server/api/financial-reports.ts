import { defineEventHandler } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { financialReports } from '../db/schema'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import {
  normalizeLocaleDefinitions,
  pickLocalizedEntry,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

/**
 * Public financial reports API
 * Returns active financial reports ordered by approval date (newest first)
 */
export default defineEventHandler(async (event) => {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(event.context.requestLocale, locales, defaultLocale)

  const items = await db.query.financialReports.findMany({
    where: eq(financialReports.active, true),
    orderBy: desc(financialReports.approvedAt),
    with: {
      translations: true,
    },
  })

  return {
    items: items.map((item) => ({
      id: item.id,
      title: pickLocalizedEntry(item.translations, locale, locales, defaultLocale)?.title ?? '',
      pdfUrl:
        toExternalPdfProxyUrl(item.pdfUrl, {
          publicPathBase: '/documentos/informes-economicos',
        }) ?? item.pdfUrl,
      approvedAt: item.approvedAt.toISOString(),
    })),
  }
})
