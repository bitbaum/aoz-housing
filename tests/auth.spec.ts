import { test, expect } from '@playwright/test'

test.describe('Staff authentication flow', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/login')

    // Login form visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('form').getByRole('button', { name: /^Anmelden$/i })).toBeVisible()
  })

  test('shows registration tab with invite code field', async ({ page }) => {
    await page.goto('/login')

    // Click register tab
    await page.getByRole('button', { name: /Registrieren/i }).first().click()

    // Registration fields visible
    await expect(page.locator('#reg-name')).toBeVisible()
    await expect(page.locator('#reg-email')).toBeVisible()
    await expect(page.locator('#reg-password')).toBeVisible()
    await expect(page.locator('#invite-code')).toBeVisible()
  })

  test('rejects login with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[type="email"]').fill('nobody@aoz.ch')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()

    // Should show error message
    await expect(page.locator('.bg-red-50, [role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test('rejects registration with invalid invite code', async ({ page }) => {
    await page.goto('/login')

    // Switch to register tab
    await page.getByRole('button', { name: /Registrieren/i }).first().click()

    await page.locator('#reg-name').fill('Test User')
    await page.locator('#reg-email').fill('test@aoz.ch')
    await page.locator('#reg-password').fill('password123')
    await page.locator('#invite-code').fill('WRONG-CODE')
    await page.locator('form').getByRole('button', { name: /^Registrieren$/i }).click()

    // Should show error
    await expect(page.locator('.bg-red-50, [role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test('portal link is accessible from login page', async ({ page }) => {
    await page.goto('/login')

    // Should have link to resident portal
    const portalLink = page.getByRole('link', { name: /Bewohner|Portal/i })
    await expect(portalLink).toBeVisible()
  })
})
