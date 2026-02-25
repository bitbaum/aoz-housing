import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.describe('Incident reporting flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureStaffLogin(page)
  })

  test('new incident form loads', async ({ page }) => {
    await page.goto('/incidents/new')

    // Form elements present
    await expect(page.locator('select[name="housingUnitId"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Speichern|Melden|Vorfall erfassen/i })).toBeVisible()
  })

  test('incident list shows existing incidents', async ({ page }) => {
    await page.goto('/incidents')

    // Page loads without errors
    await expect(page.locator('h1, h2').first()).toContainText(/Vorfälle/i)

    // Should have a "new incident" link/button
    await expect(page.getByRole('link', { name: /Neuer Vorfall|Vorfall melden/i })).toBeVisible()
  })
})

test.describe('Portal — unauthenticated access', () => {
  test('portal redirects to login without resident cookie', async ({ page }) => {
    await page.goto('/portal')

    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 5000 })
    await expect(page.locator('#code')).toBeVisible()
  })
})
