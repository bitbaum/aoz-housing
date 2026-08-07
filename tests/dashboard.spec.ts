import { test, expect } from '@playwright/test'
import { BRAND } from '../src/lib/config/brand'
import { findAdminNavLink } from './helpers'

// storageState from playwright.config handles staff auth

test.describe('Dashboard', () => {
  test('dashboard loads with action-oriented content', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(new RegExp(BRAND.shortName))

    // Scoped to <main>: MobileNav renders the whole nav list into the DOM at
    // every viewport and only hides it with CSS, so an unscoped `.first()`
    // resolves to a hidden nav link and the visibility check always fails.
    const main = page.locator('main')
    const hasActions = await main.getByText(/Platzierung|Bewohner|Check-in|Vorfall/i).first().isVisible().catch(() => false)
    const hasAllClear = await main.getByText(/Alles erledigt|Keine offenen/i).first().isVisible().catch(() => false)

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

    for (const href of ['/residents', '/housing', '/matching']) {
      await findAdminNavLink(page, href)
    }
  })
})
