import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.setTimeout(60_000)

test.beforeEach(async ({ page }) => {
  await ensureStaffLogin(page)
})

test.describe('Dashboard', () => {
  test('dashboard loads with action-oriented content', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/AOZ/)

    const hasActions = await page.getByText(/Platzierung|Bewohner|Check-in|Vorfall/i).first().isVisible().catch(() => false)
    const hasAllClear = await page.getByText(/Alles erledigt|Keine offenen/i).isVisible().catch(() => false)

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

    await expect(page.locator('aside a[href="/residents"]').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('aside a[href="/housing"]').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('aside a[href="/matching"]').first()).toBeVisible({ timeout: 15_000 })
  })
})
