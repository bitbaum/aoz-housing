/**
 * Database connection — one pg Pool for the whole app, shared through
 * Next.js hot reloads via globalThis (the standard Drizzle/Next pattern).
 */
import { Pool } from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { pool?: Pool }

function makePool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  return new Pool({ connectionString, max: 10 })
}

const pool = globalForDb.pool ?? makePool()
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })
export { schema }
