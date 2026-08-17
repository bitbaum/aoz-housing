import { test, expect } from '@playwright/test'
import { openEmailLoginForm } from './helpers'

// storageState from playwright.config handles staff auth

test.describe('Incident reporting flow', () => {

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
  // Clear storageState to test unauthenticated access
  test.use({ storageState: { cookies: [], origins: [] } })

  test('portal redirects to login without resident cookie', async ({ page }) => {
    await page.goto('/portal')

    // Should redirect to /login — check final URL and page content
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
    await openEmailLoginForm(page)
    await expect(page.locator('#email')).toBeVisible()
  })
})
