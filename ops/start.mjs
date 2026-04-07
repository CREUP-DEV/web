import { runMigrations } from './migrate.mjs'

const shouldRunMigrationsOnStart = process.env.RUN_MIGRATIONS_ON_START === 'true'

if (shouldRunMigrationsOnStart) {
  console.log('RUN_MIGRATIONS_ON_START=true: applying migrations before app start...')
  await runMigrations()
  console.log('Migrations completed.')
}

await import('/app/.output/server/index.mjs')
