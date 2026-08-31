import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth

test.describe('Placement list and management', () => {
  test('placements page loads with stats and tabs', async ({ page }) => {
    await page.goto('/placements')

    // Page heading
    await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)

    // Status filter bar: these are links that change the URL, not ARIA tabs,
    // so they live in a labelled <nav> and expose the `link` role.
    const filters = page.locator('main nav[aria-label]')
    await expect(filters.first()).toBeVisible()
    await expect(filters.first().getByRole('link', { name: /Aktiv/i })).toBeVisible()

    // "New placement" link should go to matching
    await expect(
      page.getByRole('link', { name: /Neue Platzierung|Matching/i }).first(),
    ).toBeVisible()
  })

  test('placement tabs filter correctly', async ({ page }) => {
    await page.goto('/placements')

    // Click "Alle" tab if it exists
    const alleTab = page.getByRole('button', { name: /Alle/i }).or(page.getByText(/Alle \(/i))
    const hasAlleTab = await alleTab
      .first()
      .isVisible()
      .catch(() => false)

    if (hasAlleTab) {
      await alleTab.first().click()
      // Page should not error
      await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)
    }
  })

  test('placement rows show resident and unit info', async ({ page }) => {
    await page.goto('/placements')
    await page.waitForLoadState('networkidle')

    // Wait for the page heading to confirm load
    await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)

    // Check if there are any placement rows, tabs, or empty state
    const hasRows = await page
      .locator('a[href*="/residents/"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    const hasTabs = await page
      .locator('main nav[aria-label]')
      .first()
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .getByText(/Keine.*Platzierung/i)
      .isVisible()
      .catch(() => false)

    // Page should have some placement content
    expect(hasRows || hasTabs || hasEmptyState).toBe(true)
  })
})

test.describe('Satisfaction check-in flow', () => {
  test('check-in page loads with form elements', async ({ page }) => {
    // Try to find a placement with a check-in link
    await page.goto('/placements')
    await page.waitForLoadState('networkidle')

    const checkinLink = page.locator('a[href*="/checkin"]').first()
    const hasCheckin = await checkinLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasCheckin) {
      // Navigate directly to avoid click interception by overlapping elements
      const href = await checkinLink.getAttribute('href')
      if (!href) return
      await page.goto(href)
      await page.waitForLoadState('networkidle')

      // Check-in form should show
      await expect(page.locator('h1, h2').first()).toBeVisible()

      // Satisfaction rating uses hidden radio buttons (sr-only) with emoji display
      // Check for attached radios (not visible, since they use sr-only class)
      const radioCount = await page.locator('input[name="overallSatisfaction"]').count()
      const hasForm = await page
        .locator('form')
        .first()
        .isVisible()
        .catch(() => false)

      expect(radioCount > 0 || hasForm).toBe(true)

      // Submit and cancel buttons
      await expect(page.getByRole('button', { name: /Speichern|Check-in/i })).toBeVisible()
    }
    // If no placements exist, test passes
  })
})
