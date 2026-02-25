/**
 * Seed Initial Admin User (code-based auth)
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 *
 * Or with custom code:
 *   ADMIN_CODE=AOZ-CUSTOM npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_CODE = process.env.ADMIN_CODE || 'AOZ-ADMIN1'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aoz.ch'

function generateStaffCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'AOZ-'
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

  // Check if admin exists by email (legacy)
  const existingByEmail = ADMIN_EMAIL
    ? await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
    : null

  if (existingByEmail) {
    // Update existing user to have a code
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { code: ADMIN_CODE },
    })
    console.log(`Updated existing admin with code: ${ADMIN_CODE}`)
    return
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      code: ADMIN_CODE,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'ADMIN',
      active: true,
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
