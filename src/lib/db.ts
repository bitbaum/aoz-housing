import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function makePrismaClient() {
  // Plain TCP to PostgreSQL. Live: Hetzner box bitbaum, database aoz_wohnen,
  // loopback-only on the box. See docs/INFRASTRUCTURE.md. Not a cloud pooler.
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
