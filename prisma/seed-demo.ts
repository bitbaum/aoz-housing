/**
 * CLI wrapper for the demo reset — wipe + reseed the presentation dataset.
 *
 * The actual logic lives in src/lib/demo/reset.ts (SSOT), shared with the
 * daily reset endpoint (api/cron/reset-demo). Relative import on purpose:
 * ts-node does not resolve tsconfig path aliases.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import { resetDemoData } from '../src/lib/demo/reset'

const prisma = new PrismaClient()

resetDemoData(prisma)
  .then((summary) => {
    console.log('✅ Demo data reset:', summary)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
