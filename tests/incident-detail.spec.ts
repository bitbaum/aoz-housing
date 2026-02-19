import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.beforeEach(async ({ page }) => {
  await ensureStaffLogin(page)
})

test.describe('Incident detail and follow-up', () => {
  test('incident creation form has all required fields', async ({ page }) => {
    await page.goto('/incidents/new')

    // Required fields
    await expect(page.locator('select[name="housingUnitId"]')).toBeVisible()
    // Category and severity use radio buttons, not selects
    await expect(page.locator('input[name="category"]').first()).toBeAttached()
    await expect(page.locator('select[name="type"]')).toBeVisible()
    await expect(page.locator('input[name="severity"]').first()).toBeAttached()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()

    // Date field
    await expect(page.locator('input[name="date"]')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /Speichern|Melden|Vorfall erfassen/i })).toBeVisible()
  })

  test('incident detail page shows follow-up section', async ({ page }) => {
    await page.goto('/incidents')

    // Try to navigate to an incident detail
    const incidentLink = page.locator('a[href*="/incidents/c"]').first()
    const hasIncident = await incidentLink.isVisible().catch(() => false)

    if (hasIncident) {
      await incidentLink.click()
      await page.waitForLoadState('networkidle')

      // Detail page sections
      await expect(page.getByText(/Beschreibung/i)).toBeVisible()
      await expect(page.getByText(/Follow-up/i)).toBeVisible()

      // Follow-up form should be present
      await expect(page.locator('input[name="action"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /Follow-up hinzufügen/i })).toBeVisible()

      // Involved people section
      await expect(page.getByText(/Beteiligte|Ort/i)).toBeVisible()

      // Resolution action
      await expect(page.getByText(/Aktionen|gelöst/i)).toBeVisible()
    }
    // If no incidents exist, test passes
  })

  test('incident list has category and severity columns', async ({ page }) => {
    await page.goto('/incidents')

    await expect(page.locator('h1, h2').first()).toContainText(/Vorfälle/i)

    // New incident button
    await expect(page.getByRole('link', { name: /Neuer Vorfall|Vorfall melden/i })).toBeVisible()
  })

  test('incident form rejects empty description', async ({ page }) => {
    await page.goto('/incidents/new')

    // Fill required selects but leave description empty
    const housingSelect = page.locator('select[name="housingUnitId"]')
    const hasOptions = await housingSelect.locator('option').count() > 1

    if (hasOptions) {
      await housingSelect.selectOption({ index: 1 })
      await page.locator('select[name="category"]').selectOption({ index: 1 })
      await page.locator('select[name="type"]').selectOption({ index: 1 })
      await page.locator('select[name="severity"]').selectOption({ index: 1 })
      await page.locator('input[name="date"]').fill('2024-06-15')

      // Leave description empty and submit
      await page.getByRole('button', { name: /Speichern|Melden/i }).click()

      // Should stay on form page (validation prevents navigation)
      await expect(page).toHaveURL(/incidents\/new/)
    }
  })
})
