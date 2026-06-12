import type { H3Event } from 'h3'
import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from '../../db'
import { getRequestLocaleContext } from '../locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../cache/publicRouteCache'
import { publicPaginationQuerySchema, validatePublicQuery } from '../validation'
import { throwPublicDatabaseAwareError } from './publicErrors'

type PublicListLocaleContext = Pick<
  ReturnType<typeof getRequestLocaleContext>,
  'locale' | 'locales' | 'fallbackLocale'
>

interface PublicPaginatedListConfig<TItem, TResult> {
  /** Table used for the total-count select. */
  table: PgTable
  /** Predicate shared by the page query (in `fetchPage`) and the count query. */
  activeWhere: SQL
  /**
   * Caller-owned page query. Kept as a thunk — rather than rebuilt from
   * orderBy/column config — so the rows it produces (and therefore the JSON) stay
   * byte-identical to the original handler.
   */
  fetchPage: (page: { limit?: number; offset?: number }) => Promise<TItem[]>
  /** Map one row to its response shape. Owns its own translation resolver, so
   *  per-handler resolver choices (field-fallback or not) are never unified. */
  mapItem: (item: TItem, ctx: PublicListLocaleContext) => TResult
  /** buildPublicRouteCacheKey scope, e.g. 'public-financial-reports'. */
  cacheScope: string
  /** throwPublicDatabaseAwareError scope base, e.g. 'public.financial-reports'. */
  errorScope: string
  /** Forwarded to buildPublicRouteCacheKey when set. */
  includeLocale?: boolean
}

/**
 * Shared envelope for paginated public read endpoints: vary headers, locale
 * context, pagination validation, a `{ data, meta: { total } }` body with a count
 * query, DB-aware error handling, and the cached-route key. The row query and the
 * row→response mapping (including translation resolution) stay with each caller.
 */
export function definePublicPaginatedListHandler<TItem, TResult>(
  config: PublicPaginatedListConfig<TItem, TResult>
) {
  return defineCachedEventHandler(
    async (event: H3Event) => {
      setPublicRouteVaryHeaders(event)
      const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
      const { limit, offset } = validatePublicQuery(event, publicPaginationQuerySchema)

      try {
        const [items, countResult] = await Promise.all([
          config.fetchPage({ limit, offset }),
          db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(config.table)
            .where(config.activeWhere),
        ])

        return {
          data: items.map((item) => config.mapItem(item, { locale, locales, fallbackLocale })),
          meta: {
            total: countResult[0]?.count ?? 0,
          },
        }
      } catch (error) {
        throwPublicDatabaseAwareError(event, config.errorScope, error)
      }
    },
    {
      ...PUBLIC_ROUTE_CACHE_OPTIONS,
      getKey: (event) =>
        buildPublicRouteCacheKey(event, config.cacheScope, {
          ...(config.includeLocale === undefined ? {} : { includeLocale: config.includeLocale }),
          queryKeys: ['limit', 'offset'],
        }),
    }
  )
}
