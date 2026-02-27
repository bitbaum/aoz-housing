import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth

test.describe('Settings page', () => {
  test('settings page loads with team and invite sections', async ({ page }) => {
    await page.goto('/settings')

    // Page heading
    await expect(page.getByRole('heading', { name: /Einstellungen/i })).toBeVisible({ timeout: 15_000 })

    // Invite form section
    await expect(page.getByRole('heading', { name: /Mitarbeiter einladen/i })).toBeVisible()

    // Team section
    await expect(page.getByRole('heading', { name: /Team/i })).toBeVisible()

    // Email config section
    await expect(page.getByRole('heading', { name: /E-Mail-Konfiguration/i })).toBeVisible()
  })

  test('invite form has name and email fields', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Einladen/i })).toBeVisible()
  })

  test('team list shows at least one staff member', async ({ page }) => {
    await page.goto('/settings')

    // At least one staff code visible (AOZ- format)
    const codeEl = page.locator('text=/AOZ-/').first()
    await expect(codeEl).toBeVisible({ timeout: 15_000 })
  })

  test('invite form shows validation error for empty submission', async ({ page }) => {
    await page.goto('/settings')

    // Wait for form to load
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 15_000 })

    // Submit without filling in fields
    await page.getByRole('button', { name: /Einladen/i }).click()

    // Browser HTML5 validation or our error message
    const hasError =
      await page.locator('[role="alert"]').isVisible().catch(() => false) ||
      await page.locator('input[name="name"]:invalid').count() > 0

    expect(hasError).toBe(true)
  })

  test('settings page is accessible from sidebar nav', async ({ page }) => {
    await page.goto('/')

    // Settings link in sidebar
    const settingsLink = page.locator('aside a[href="/settings"]').first()
    await expect(settingsLink).toBeVisible({ timeout: 15_000 })

    await settingsLink.click()
    await page.waitForURL('**/settings', { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: /Einstellungen/i })).toBeVisible()
  })
})
