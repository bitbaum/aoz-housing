import { test, expect } from '@playwright/test'
import { BRAND } from '../src/lib/config/brand'

// Auth tests need clean state (no existing session)
test.use({ storageState: { cookies: [], origins: [] } })

/**
 * Wait for React to hydrate the login form.
 *
 * The login page is a 'use client' component. In development mode,
 * webpack uses eval() for HMR source maps. Without 'unsafe-eval' in
 * the CSP, React never hydrates, the form submits natively (GET),
 * and no state changes appear.
 *
 * We detect hydration by verifying the controlled onChange handler
 * is active: React uppercases the input value on every change.
 */
async function waitForLoginFormReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  // Verify React's onChange is active (converts to uppercase)
  await page.locator('#code').fill('x')
  await expect(page.locator('#code')).toHaveValue('X', { timeout: 10000 })
  await page.locator('#code').clear()
}

test.describe('Authentication flow', () => {
  test('login page loads with code input', async ({ page }) => {
    await page.goto('/login')

    // Code input visible
    await expect(page.locator('#code')).toBeVisible()
    await expect(page.locator('#code')).toHaveAttribute('placeholder', /AOZ-|RES-/)

    // Submit button visible
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('rejects login with invalid code', async ({ page }) => {
    await page.goto('/login')
    await waitForLoginFormReady(page)

    await page.locator('#code').fill('INVALID-CODE')
    await page.locator('button[type="submit"]').click()

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 })
  })

  test('shows success and redirects on valid staff login', async ({ page }) => {
    const staffCode = process.env.E2E_STAFF_CODE || `${BRAND.codePrefix}ADMIN1`
    await page.goto('/login')
    await waitForLoginFormReady(page)

    await page.locator('#code').fill(staffCode)
    await page.locator('button[type="submit"]').click()

    // Success state shows green checkmark
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10000 })

    // Redirects to dashboard
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 })
  })

  test('code input is case-insensitive', async ({ page }) => {
    const staffCode = process.env.E2E_STAFF_CODE || `${BRAND.codePrefix}ADMIN1`
    await page.goto('/login')
    await waitForLoginFormReady(page)

    // Enter lowercase code
    await page.locator('#code').fill(staffCode.toLowerCase())
    await page.locator('button[type="submit"]').click()

    // Should still succeed (API uppercases before lookup)
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10000 })
  })
})
