/**
 * Programmatic migration runner — applies ./drizzle/*.sql in order.
 * Run: npm run db:migrate
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://fitfoot:fitfoot@localhost:5432/fitfoot'
  const pool = new Pool({ connectionString, max: 1 })
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
  console.log('Migrations applied.')
  await pool.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
