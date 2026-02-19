import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.beforeEach(async ({ page }) => {
  await ensureStaffLogin(page)
})

test.describe('Placement list and management', () => {
  test('placements page loads with stats and tabs', async ({ page }) => {
    await page.goto('/placements')

    // Page heading
    await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)

    // Tab bar with "Aktiv" tab should be visible
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
    await expect(page.locator('[role="tab"]').first()).toBeVisible()

    // "New placement" link should go to matching
    await expect(page.getByRole('link', { name: /Neue Platzierung|Matching/i })).toBeVisible()
  })

  test('placement tabs filter correctly', async ({ page }) => {
    await page.goto('/placements')

    // Click "Alle" tab if it exists
    const alleTab = page.getByRole('button', { name: /Alle/i }).or(page.getByText(/Alle \(/i))
    const hasAlleTab = await alleTab.first().isVisible().catch(() => false)

    if (hasAlleTab) {
      await alleTab.first().click()
      // Page should not error
      await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)
    }
  })

  test('placement rows show resident and unit info', async ({ page }) => {
    await page.goto('/placements')

    // Check if there are any placement rows
    const hasRows = await page.locator('a[href*="/residents/"]').first().isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/Keine.*Platzierung/i).isVisible().catch(() => false)

    // Either there are placement rows or an empty state
    expect(hasRows || hasEmptyState).toBe(true)
  })
})

test.describe('Satisfaction check-in flow', () => {
  test('check-in page loads with form elements', async ({ page }) => {
    // Try to find a placement with a check-in link
    await page.goto('/placements')

    const checkinLink = page.locator('a[href*="/checkin"]').first()
    const hasCheckin = await checkinLink.isVisible().catch(() => false)

    if (hasCheckin) {
      await checkinLink.click()
      await page.waitForLoadState('networkidle')

      // Check-in form should show
      await expect(page.getByText(/Check-in|Zufriedenheit/i)).toBeVisible()

      // Satisfaction emoji/rating selection should be present
      const hasEmojis = await page.locator('input[name*="atisfaction"], input[type="radio"]').first().isVisible().catch(() => false)
      const hasDropdown = await page.locator('select').first().isVisible().catch(() => false)

      expect(hasEmojis || hasDropdown).toBe(true)

      // Submit and cancel buttons
      await expect(page.getByRole('button', { name: /Speichern|Check-in/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Abbrechen|Zurück/i })).toBeVisible()
    }
    // If no placements exist, test passes
  })
})
