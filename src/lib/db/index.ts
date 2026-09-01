import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schemaTables from './schema'
import * as schemaRelations from './relations'

// db.query needs tables AND relations in one schema object.
const schema = { ...schemaTables, ...schemaRelations }

// Lazy singleton (fleet pattern, see reparaturbonus-zh / vitareba): the Pool
// is not created at module load time, so Next.js build-time page analysis
// doesn't throw when DATABASE_URL is absent in the build environment.
type DbInstance = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as { db: DbInstance | undefined }

function getInstance(): DbInstance {
  if (!globalForDb.db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    globalForDb.db = drizzle(new Pool({ connectionString: url }), { schema })
  }
  return globalForDb.db
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return Reflect.get(getInstance(), prop)
  },
})

export * from './schema'
export * from './types'
