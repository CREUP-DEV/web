import { sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { SUPPORTED_LOCALE_CODES } from '../../../shared/constants/locales'

export const cuid = () => createId()

const SUPPORTED_LOCALE_SQL = sql.raw(
  SUPPORTED_LOCALE_CODES.map((locale) => `'${locale.replace(/'/g, "''")}'`).join(', ')
)

export const buildSupportedLocaleCheck = (localeColumn: unknown) =>
  sql`${localeColumn} in (${SUPPORTED_LOCALE_SQL})`
