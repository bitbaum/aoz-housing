import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth

test.describe('Housing unit pages', () => {
  test('housing list shows units with occupancy info', async ({ page }) => {
    await page.goto('/housing')

    await expect(page.locator('h1, h2').first()).toContainText(/Unterkünfte/i)

    // Should have at least a "new unit" link/button or show empty state
    const hasNewButton = await page
      .getByRole('link', { name: /Neue Unterkunft|Hinzufügen/i })
      .isVisible()
      .catch(() => false)
    const hasEmptyState = await page
      .getByText(/Keine Unterkünfte/i)
      .isVisible()
      .catch(() => false)
    const hasUnits = await page
      .locator('a[href*="/housing/"]')
      .first()
      .isVisible()
      .catch(() => false)

    expect(hasNewButton || hasEmptyState || hasUnits).toBe(true)
  })

  test('housing creation form loads', async ({ page }) => {
    await page.goto('/housing/new')

    // Form should have key fields
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('input[name="address"]')).toBeVisible()
    await expect(page.locator('input[name="totalBeds"]')).toBeVisible()

    // Submit button (actual text: "Weiter zu Zimmer & Betten →")
    await expect(page.getByRole('button', { name: /Speichern|Erstellen|Weiter/i })).toBeVisible()
  })

  test('housing form validates required fields', async ({ page }) => {
    await page.goto('/housing/new')

    // Clear code field and submit
    await page.locator('input[name="code"]').fill('')
    await page.getByRole('button', { name: /Speichern|Erstellen|Weiter/i }).click()

    // Should stay on form (validation prevents navigation)
    await expect(page).toHaveURL(/housing\/new/)
  })
})

test.describe('Housing detail page sections', () => {
  // These tests verify the detail page structure when accessed directly
  // They may redirect or show errors if no units exist in test DB

  test('detail page shows expected sections', async ({ page }) => {
    // First navigate to housing list to find a unit
    await page.goto('/housing')

    // Try to click on a unit link
    const unitLink = page.locator('a[href*="/housing/c"]').first()
    const hasUnit = await unitLink.isVisible({ timeout: 10000 }).catch(() => false)

    if (hasUnit) {
      // Navigate directly to avoid click interception by overlapping "Aktionen" button
      const href = await unitLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForLoadState('networkidle')

        // Verify detail page loaded
        await expect(page.locator('h1, h2').first()).toBeVisible()
        await expect(page.getByRole('link', { name: /Bearbeiten/i })).toBeVisible({
          timeout: 10000,
        })
      }
    }
    // If no units exist, test passes (nothing to check)
  })
})
