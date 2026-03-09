import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../db'
import { tags } from '../db/schema'
import {
  normalizeLocaleDefinitions,
  pickLocalizedEntry,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

export default defineEventHandler(async (event) => {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(event.context.requestLocale, locales, defaultLocale)

  const tagsList = await db.query.tags.findMany({
    orderBy: asc(tags.order),
    with: { translations: true },
  })

  const payload = {
    tags: tagsList.map((tag) => {
      const trans = pickLocalizedEntry(tag.translations, locale, locales, defaultLocale)
      return {
        slug: tag.slug,
        name: trans?.name ?? tag.slug,
      }
    }),
  }

  return payload
})
