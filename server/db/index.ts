import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { requireConfigString } from '../../shared/utils/config'
import * as schema from './schema'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')

const pool = new Pool({
  connectionString,
  // Keep enough connections to serve concurrent API requests and the newsletter
  // delivery worker without exhausting the DB. node-postgres default is 10.
  max: Number(process.env.DB_POOL_MAX) || 20,
  // Release idle connections after 30 s to free server-side resources.
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30_000,
  // Fail fast if the pool is exhausted (better than silently hanging).
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS) || 5_000,
})

export const db = drizzle(pool, { schema })
