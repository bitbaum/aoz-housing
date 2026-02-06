/**
 * Seed Initial Admin User
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 *
 * Or with custom password:
 *   ADMIN_PASSWORD=mypassword npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aoz.ch'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123' // CHANGE IN PRODUCTION
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator'

async function main() {
  console.log('Creating admin user...')

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`)
    console.log('To update the password, delete the user first and re-run this script.')
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('Admin user created successfully!')
  console.log(`  Email: ${admin.email}`)
  console.log(`  Name: ${admin.name}`)
  console.log(`  Role: ${admin.role}`)
  console.log('')
  console.log('IMPORTANT: Change the default password immediately after first login!')
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
