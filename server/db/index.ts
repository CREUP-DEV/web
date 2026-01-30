/**
 * Database client using Drizzle ORM
 * This is the main database connection for the server
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

export const db = drizzle(connectionString, { schema })
