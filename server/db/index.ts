import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { requireConfigString } from '../../shared/utils/config'
import { logError } from '../utils/logger'
import * as schema from './schema'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')
const configuredMaxConnections = Number(process.env.DATABASE_MAX_CONNECTIONS) || 10

interface DatabasePoolErrorSummary {
  name: string
  message: string
  code?: string | number
}

interface DatabasePoolErrorState {
  errorCount: number
  lastErrorAt: string | null
  lastError: DatabasePoolErrorSummary | null
}

interface DatabasePoolStats {
  totalCount: number
  idleCount: number
  waitingCount: number
  maxConnections: number
  errorCount: number
  lastErrorAt: string | null
  lastError: DatabasePoolErrorSummary | null
}

const pool = new Pool({
  connectionString,
  // Cap concurrent DB connections. Tune to match your Postgres plan's limit.
  max: configuredMaxConnections,
  // Release idle connections after 10 s to free server-side resources.
  idleTimeoutMillis: 10_000,
  // Fail fast if a connection cannot be acquired within 30 s.
  connectionTimeoutMillis: 30_000,
})

const poolErrorState: DatabasePoolErrorState = {
  errorCount: 0,
  lastErrorAt: null,
  lastError: null,
}

function buildDatabasePoolErrorSummary(error: unknown): DatabasePoolErrorSummary {
  if (error instanceof Error) {
    const poolError = error as Error & { code?: unknown }
    const code =
      typeof poolError.code === 'string' || typeof poolError.code === 'number'
        ? poolError.code
        : undefined

    return {
      name: error.name,
      message: error.message.slice(0, 200),
      code,
    }
  }

  return {
    name: 'Error',
    message: String(error).slice(0, 200),
  }
}

pool.on('error', (error) => {
  poolErrorState.errorCount += 1
  poolErrorState.lastErrorAt = new Date().toISOString()
  poolErrorState.lastError = buildDatabasePoolErrorSummary(error)
  logError('db.pool', error)
})

export function getDatabasePoolStats(): DatabasePoolStats {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: configuredMaxConnections,
    errorCount: poolErrorState.errorCount,
    lastErrorAt: poolErrorState.lastErrorAt,
    lastError: poolErrorState.lastError,
  }
}

export const db = drizzle(pool, { schema })
