import type { Page } from '@playwright/test'

const STAFF_CODE = process.env.E2E_STAFF_CODE || 'AOZ-ADMIN1'

export async function ensureStaffLogin(page: Page) {
  await page.goto('/login')
  await page.locator('#code').fill(STAFF_CODE)
  await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
}
