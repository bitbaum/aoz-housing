import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth
test.use({ viewport: { width: 375, height: 667 } })

test.describe('Mobile Responsiveness', () => {
  test('dashboard loads without horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1 for rounding
  })

  test('residents list is usable on mobile', async ({ page }) => {
    await page.goto('/residents')
    await page.waitForLoadState('networkidle')

    // Should not have forced horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })

  test('housing detail page works on mobile', async ({ page }) => {
    await page.goto('/housing')
    await page.waitForLoadState('networkidle')

    // Click first housing unit if available
    const firstUnit = page.locator('a[href*="/housing/"]').first()
    if (await firstUnit.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstUnit.click()
      await page.waitForLoadState('networkidle')

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
    }
  })

  test('navigation hamburger works on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Mobile menu trigger has aria-label="Menü öffnen"
    const menuTrigger = page.locator('button[aria-label="Menü öffnen"]')

    await expect(menuTrigger).toBeVisible({ timeout: 5000 })
    await menuTrigger.click()

    // Navigation links should become visible in the drawer
    await expect(page.locator('[role="dialog"] a[href="/residents"]')).toBeVisible({ timeout: 5000 })
  })

  test('login page works on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)

    // The email login form should be visible and usable
    await expect(page.locator('#email')).toBeVisible()
  })
})
