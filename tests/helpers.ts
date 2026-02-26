import type { Page } from '@playwright/test'

const STAFF_CODE = process.env.E2E_STAFF_CODE || 'AOZ-ADMIN1'

/**
 * Ensure the page has a valid staff session.
 * With storageState in playwright.config, we should already be authenticated.
 * This function falls back to UI login if the session is missing.
 */
export async function ensureStaffLogin(page: Page) {
  // Navigate to dashboard — middleware will redirect to /login if no session
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // If we got redirected to login, do a UI login
  if (page.url().includes('/login')) {
    await page.locator('#code').fill(STAFF_CODE)
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
  }
}
