import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth

test.describe('Dashboard', () => {
  test('dashboard loads with action-oriented content', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/AOZ/)

    // Scope to main — the (hidden) mobile nav drawer also contains these words
    const main = page.locator('main')
    const hasActions = await main.getByText(/Platzierung|Bewohner|Check-in|Vorfall/i).first().isVisible().catch(() => false)
    const hasAllClear = await main.getByText(/Alles erledigt|Alles unter Kontrolle|Keine offenen/i).first().isVisible().catch(() => false)

    expect(hasActions || hasAllClear).toBe(true)
  })

  test('dashboard quick stats are visible', async ({ page }) => {
    await page.goto('/')

    const statsLinks = page.locator('main a[href*="/housing"], main a[href*="/placements"], main a[href*="/incidents"], main a[href*="/maintenance"]')
    await expect(statsLinks.first()).toBeVisible({ timeout: 30_000 })
    expect(await statsLinks.count()).toBeGreaterThan(0)
  })

  test('dashboard contains core admin navigation links', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')

    // Residents + Matching live in the "Personen" megamenu dropdown (opens on hover)
    await header.getByRole('button', { name: 'Personen' }).hover()
    await expect(header.locator('a[href="/residents"]').first()).toBeVisible({ timeout: 15_000 })
    await expect(header.locator('a[href="/matching"]').first()).toBeVisible({ timeout: 15_000 })

    // Housing lives in the "Unterkünfte" megamenu dropdown
    await header.getByRole('button', { name: 'Unterkünfte' }).hover()
    await expect(header.locator('a[href="/housing"]').first()).toBeVisible({ timeout: 15_000 })
  })
})
