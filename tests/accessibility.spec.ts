import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'

// storageState from playwright.config handles staff auth
test.setTimeout(90_000)

/** Run axe WCAG 2.1 A/AA scan and assert no critical/serious violations. */
async function assertNoViolations(page: import('@playwright/test').Page, label: string) {
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // Evaluated separately via design-system review
    .analyze()

  const critical = results.violations.filter(
    (v: Result) => v.impact === 'critical' || v.impact === 'serious'
  )

  if (critical.length > 0) {
    const summary = critical
      .map((v: Result) => `${v.impact}: ${v.id} — ${v.description} (${v.nodes.length} nodes)`)
      .join('\n')
    expect(critical, `A11y violations on ${label}:\n${summary}`).toHaveLength(0)
  }
}

// =============================================================================
// Admin pages (staff auth via storageState)
// =============================================================================

test.describe('Accessibility — admin pages', () => {
  const adminPages = [
    { name: 'Dashboard', url: '/' },
    { name: 'Residents list', url: '/residents' },
    { name: 'Housing list', url: '/housing' },
    { name: 'Matching', url: '/matching' },
    { name: 'Incidents list', url: '/incidents' },
    { name: 'Maintenance list', url: '/maintenance' },
    { name: 'Placements list', url: '/placements' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Settings', url: '/settings' },
    { name: 'Transfer Requests', url: '/transfer-requests' },
    { name: 'Algorithm', url: '/algorithm' },
    { name: 'AI Assistant', url: '/ai-assistant' },
    { name: 'Chores (admin)', url: '/chores' },
  ]

  for (const { name, url } of adminPages) {
    test(`${name} has no critical a11y violations`, async ({ page }) => {
      await page.goto(url)
      await assertNoViolations(page, name)
    })
  }
})

// =============================================================================
// Login page (no auth required)
// =============================================================================

test.describe('Accessibility — login', () => {
  test('Login page has no critical a11y violations', async ({ page }) => {
    await page.goto('/login')
    await assertNoViolations(page, 'Login')
  })
})

// =============================================================================
// Portal pages (resident auth via cookie injection)
// =============================================================================

test.describe('Accessibility — portal pages', () => {
  // Override storageState to start with staff session, then inject resident cookie
  // RES-001 is PLACED so all portal sub-pages render full content
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'resident_code',
        value: 'RES-001',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ])
  })

  const portalPages = [
    { name: 'Portal dashboard', url: '/portal' },
    { name: 'Portal preferences', url: '/portal/preferences' },
    { name: 'Portal chores', url: '/portal/chores' },
    { name: 'Portal chores new', url: '/portal/chores/new' },
    { name: 'Portal report', url: '/portal/report' },
    { name: 'Portal transfer', url: '/portal/transfer' },
    { name: 'Portal housing', url: '/portal/housing' },
    { name: 'Portal roommates', url: '/portal/roommates' },
    { name: 'Portal activities', url: '/portal/activities' },
    { name: 'Portal help', url: '/portal/help' },
  ]

  for (const { name, url } of portalPages) {
    test(`${name} has no critical a11y violations`, async ({ page }) => {
      await page.goto(url)
      await assertNoViolations(page, name)
    })
  }
})
