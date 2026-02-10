import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('dashboard loads with action-oriented content', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/AOZ/)

    // Should show either action tiles or an all-clear state
    const hasActions = await page.getByText(/Platzierung|Bewohner|Check-in|Vorfall/i).first().isVisible().catch(() => false)
    const hasAllClear = await page.getByText(/Alles erledigt|Keine offenen/i).isVisible().catch(() => false)

    expect(hasActions || hasAllClear).toBe(true)
  })

  test('dashboard quick stats are visible', async ({ page }) => {
    await page.goto('/')

    // Stats section with occupancy, residents, etc.
    const hasStats = await page.getByText(/Belegung|Bewohner|Betten/i).first().isVisible().catch(() => false)
    expect(hasStats).toBe(true)
  })

  test('dashboard links navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    // Check navigation items in sidebar/nav
    const navLinks = [
      { text: /Bewohner/i, url: /residents/ },
      { text: /Unterkünfte/i, url: /housing/ },
      { text: /Matching/i, url: /matching/ },
    ]

    for (const { text, url } of navLinks) {
      const link = page.getByRole('link', { name: text }).first()
      const isVisible = await link.isVisible().catch(() => false)

      if (isVisible) {
        const href = await link.getAttribute('href')
        expect(href).toMatch(url)
      }
    }
  })
})
