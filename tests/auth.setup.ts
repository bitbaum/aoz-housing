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

  const staffCode = process.env.E2E_STAFF_CODE || 'AOZ-ADMIN1'

  // Login with staff code (assumes DB is seeded with this user)
  const loginRes = await ctx.post('/api/auth/login', {
    data: { code: staffCode },
  })

  if (!loginRes.ok()) {
    const body = await loginRes.text()
    throw new Error(
      `E2E global setup: login failed (${loginRes.status()}). ` +
      `Ensure DB is seeded with code "${staffCode}". Response: ${body}`
    )
  }

  await ctx.storageState({ path: STAFF_STATE_PATH })
  await ctx.dispose()
}
