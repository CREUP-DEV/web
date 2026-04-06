import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { requireConfigString } from '../../shared/utils/config'
import * as schema from './schema'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')

const pool = new Pool({ connectionString })

export const db = drizzle(pool, { schema })
