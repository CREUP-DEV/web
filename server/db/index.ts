import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { requireConfigString } from '../../shared/utils/config'
import * as schema from './schema'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')

const pool = new Pool({
  connectionString,
  // Cap concurrent DB connections. Tune to match your Postgres plan's limit.
  max: Number(process.env.DATABASE_MAX_CONNECTIONS) || 10,
  // Release idle connections after 10 s to free server-side resources.
  idleTimeoutMillis: 10_000,
  // Fail fast if a connection cannot be acquired within 30 s.
  connectionTimeoutMillis: 30_000,
})

export const db = drizzle(pool, { schema })
