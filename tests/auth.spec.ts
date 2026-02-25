import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('login page loads with code input', async ({ page }) => {
    await page.goto('/login')

    // Code input visible
    await expect(page.locator('#code')).toBeVisible()
    await expect(page.locator('#code')).toHaveAttribute('placeholder', /AOZ-|RES-/)

    // Submit button visible
    await expect(page.locator('form').getByRole('button', { name: /^Anmelden$/i })).toBeVisible()
  })

  test('rejects login with invalid code', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#code').fill('INVALID-CODE')
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test('shows success and redirects on valid staff login', async ({ page }) => {
    const staffCode = process.env.E2E_STAFF_CODE || 'AOZ-ADMIN1'
    await page.goto('/login')

    await page.locator('#code').fill(staffCode)
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

    // Success state shows green checkmark
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })

    // Redirects to dashboard
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 })
  })

  test('code input is case-insensitive', async ({ page }) => {
    const staffCode = process.env.E2E_STAFF_CODE || 'AOZ-ADMIN1'
    await page.goto('/login')

    // Enter lowercase code
    await page.locator('#code').fill(staffCode.toLowerCase())
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

    // Should still succeed (API uppercases)
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
  })
})
