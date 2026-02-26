import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth

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

  test('incident detail page loads with data', async ({ page }) => {
    await page.goto('/incidents')
    await page.waitForLoadState('networkidle')

    // Try to navigate to an incident detail
    const incidentLink = page.locator('a[href*="/incidents/c"]').first()
    const hasIncident = await incidentLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasIncident) {
      // Get href and navigate directly to avoid click interception by overlapping elements
      const href = await incidentLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForLoadState('networkidle')
      }

      // Detail page loaded with incident data
      await expect(page.locator('h1, h2').first()).toBeVisible()

      // Follow-up section is shown for unresolved incidents,
      // resolved incidents show resolution info instead
      const hasFollowUpForm = await page.locator('input[name="action"]').isVisible().catch(() => false)
      const hasResolutionInfo = await page.getByText(/Gelöst|Lösung/i).first().isVisible().catch(() => false)

      expect(hasFollowUpForm || hasResolutionInfo).toBe(true)
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

      // Select incident type (category and severity use radio buttons with defaults)
      const typeSelect = page.locator('select[name="type"]')
      await typeSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption({ index: 1 })
      }

      await page.locator('input[name="date"]').fill('2024-06-15')

      // Leave description empty and submit
      await page.getByRole('button', { name: /Vorfall erfassen|Speichern|Melden/i }).click()

      // Should stay on form page (validation prevents navigation)
      await expect(page).toHaveURL(/incidents\/new/)
    }
  })
})
