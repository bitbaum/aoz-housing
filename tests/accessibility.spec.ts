import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'

// storageState from playwright.config handles staff auth
test.setTimeout(90_000)

test.describe('Accessibility', () => {
  const pages = [
    { name: 'Dashboard', url: '/' },
    { name: 'Residents', url: '/residents' },
    { name: 'Housing', url: '/housing' },
    { name: 'Matching', url: '/matching' },
  ]

  for (const { name, url } of pages) {
    test(`${name} page has no critical accessibility violations`, async ({ page }) => {
      await page.goto(url)
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // Skip color contrast for now
        .analyze()

      const critical = results.violations.filter((v: Result) => v.impact === 'critical' || v.impact === 'serious')

      if (critical.length > 0) {
        const summary = critical.map((v: Result) => `${v.impact}: ${v.id} - ${v.description} (${v.nodes.length} instances)`).join('\n')
        expect(critical, `Accessibility violations on ${name}:\n${summary}`).toHaveLength(0)
      }
    })
  }

  test('Login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()

    const critical = results.violations.filter((v: Result) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical).toHaveLength(0)
  })
})
