import 'dotenv/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const scriptFile = fileURLToPath(import.meta.url)
const migrationsFolder = resolve(scriptDir, '..', 'drizzle')
const MIGRATIONS_ADVISORY_LOCK_ID = 8_821_143
const REQUIRED_EXTENSIONS = ['pg_trgm']

export async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.')
  }

  console.log(`🚀 Starting database migrations from "${migrationsFolder}".`)
  const pool = new pg.Pool({ connectionString: databaseUrl })

  try {
    const client = await pool.connect()

    try {
      console.log('🔒 Acquiring migrations advisory lock.')
      await client.query('SELECT pg_advisory_lock($1)', [MIGRATIONS_ADVISORY_LOCK_ID])

      for (const extension of REQUIRED_EXTENSIONS) {
        console.log(`🧩 Ensuring PostgreSQL extension "${extension}".`)
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${extension}"`)
      }

      console.log('🛠️ Applying Drizzle migrations.')
      const db = drizzle(client)
      await migrate(db, { migrationsFolder })
      console.log('✅ Database migrations applied successfully.')
    } finally {
      try {
        console.log('🔓 Releasing migrations advisory lock.')
        await client.query('SELECT pg_advisory_unlock($1)', [MIGRATIONS_ADVISORY_LOCK_ID])
      } finally {
        client.release()
      }
    }
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptFile) {
  try {
    await runMigrations()
  } catch (error) {
    console.error('❌ Failed to apply database migrations.', error)
    process.exitCode = 1
  }
}
