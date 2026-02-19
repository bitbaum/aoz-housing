import { request, FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const AUTH_DIR = path.join(process.cwd(), 'tests', '.auth')
const STAFF_STATE_PATH = path.join(AUTH_DIR, 'staff.json')

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined
  if (!baseURL) {
    throw new Error('Playwright baseURL is not configured')
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const ctx = await request.newContext({ baseURL })

  const email = process.env.E2E_STAFF_EMAIL || 'e2e.staff@aoz.test'
  const password = process.env.E2E_STAFF_PASSWORD || 'Password123!'
  const inviteCode = process.env.AOZ_REGISTRATION_CODE || process.env.STAFF_INVITE_CODE || '0000'

  // Try registration first (works for fresh DB)
  const registerRes = await ctx.post('/api/auth/register', {
    data: {
      name: 'E2E Staff',
      email,
      password,
      inviteCode,
    },
  })

  // If already exists, login instead
  if (!registerRes.ok()) {
    await ctx.post('/api/auth/login', {
      data: { email, password },
    })
  }

  await ctx.storageState({ path: STAFF_STATE_PATH })
  await ctx.dispose()
}
