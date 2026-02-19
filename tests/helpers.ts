import type { Page } from '@playwright/test'

const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL || 'e2e.staff@aoz.test'
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD || 'Password123!'

export async function ensureStaffLogin(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(STAFF_EMAIL)
  await page.locator('input[type="password"]').fill(STAFF_PASSWORD)
  await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
}
