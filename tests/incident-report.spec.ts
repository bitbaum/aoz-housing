import { test, expect } from '@playwright/test'

test.describe('Incident reporting flow', () => {
  test('new incident form loads', async ({ page }) => {
    await page.goto('/incidents/new')

    // Form elements present
    await expect(page.locator('select[name="housingUnitId"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Speichern|Melden/i })).toBeVisible()
  })

  test('incident list shows existing incidents', async ({ page }) => {
    await page.goto('/incidents')

    // Page loads without errors
    await expect(page.locator('h1, h2').first()).toContainText(/Vorfälle/i)

    // Should have a "new incident" link/button
    await expect(page.getByRole('link', { name: /Neuer Vorfall|Vorfall melden/i })).toBeVisible()
  })
})

test.describe('Portal — resident login', () => {
  test('portal login page loads', async ({ page }) => {
    await page.goto('/portal')

    // Login form visible
    await expect(page.getByPlaceholder(/Code/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Einloggen|Anmelden/i })).toBeVisible()
  })

  test('rejects invalid code', async ({ page }) => {
    await page.goto('/portal')

    await page.getByPlaceholder(/Code/i).fill('INVALID-CODE-123')
    await page.getByRole('button', { name: /Einloggen|Anmelden/i }).click()

    // Should show error
    await expect(page.getByText(/nicht gefunden|ungültig/i)).toBeVisible({ timeout: 5000 })
  })
})
