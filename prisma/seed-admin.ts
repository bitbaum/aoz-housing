/**
 * Seed Initial Admin User (code-based auth)
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 *
 * Or with custom code:
 *   ADMIN_CODE=AOCH-CUSTOM npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'
// Relative, not '@/': this runs under ts-node, which does not apply tsconfig paths.
import { BRAND } from '../src/lib/config/brand'

const prisma = new PrismaClient()

// Derived from the active brand — a rebrand must not silently orphan the seeded
// admin, which is exactly what happened when the default moved to AOCH.
const ADMIN_CODE = process.env.ADMIN_CODE || `${BRAND.codePrefix}ADMIN1`
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aoz.ch'

function generateStaffCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = BRAND.codePrefix
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function main() {
  console.log('Creating admin user...')

  // Check if admin already exists by code
  const existingByCode = await prisma.user.findUnique({
    where: { code: ADMIN_CODE },
  })

  if (existingByCode) {
    console.log(`Admin user already exists with code: ${ADMIN_CODE}`)
    return
  }

  // Email lives on the Account, not the User — an admin seeded under a former
  // code prefix is found through the account that carries the same email.
  const existingByEmail = ADMIN_EMAIL
    ? await prisma.account.findUnique({
        where: { email: ADMIN_EMAIL.toLowerCase() },
        select: { userId: true },
      })
    : null

  if (existingByEmail?.userId) {
    // Update existing user to have a code
    await prisma.user.update({
      where: { id: existingByEmail.userId },
      data: { code: ADMIN_CODE },
    })
    console.log(`Updated existing admin with code: ${ADMIN_CODE}`)
    return
  }

  // Create admin user. No password: the account is deliberately unclaimed, so
  // the first sign-in proves mailbox control via /forgot-password.
  const admin = await prisma.user.create({
    data: {
      code: ADMIN_CODE,
      name: ADMIN_NAME,
      role: 'ADMIN',
      active: true,
      account: { create: { email: ADMIN_EMAIL.toLowerCase() } },
    },
  })

  console.log('Admin user created successfully!')
  console.log(`  Code: ${admin.code}`)
  console.log(`  Name: ${admin.name}`)
  console.log(`  Role: ${admin.role}`)
  console.log('')
  console.log(`Use code "${admin.code}" to log in.`)
  console.log('')
  console.log(`To generate additional staff codes, use: ${generateStaffCode()}`)
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
