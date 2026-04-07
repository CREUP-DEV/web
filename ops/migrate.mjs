import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = resolve(scriptDir, 'drizzle')

export async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.')
  }

  const pool = new pg.Pool({ connectionString: databaseUrl })

  try {
    const db = drizzle(pool)
    await migrate(db, { migrationsFolder })
  } finally {
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runMigrations()
    console.log('Database migrations applied successfully.')
  } catch (error) {
    console.error('Failed to apply database migrations.', error)
    process.exitCode = 1
  }
}
