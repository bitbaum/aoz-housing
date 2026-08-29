import { test, expect } from '@playwright/test'
import { portalLocaleCookie } from './helpers'

/**
 * Portal E2E tests — resident self-service interface
 *
 * Auth model:
 *   - Staff session (default storageState) has no resident_code cookie
 *   - Portal pages require resident_code cookie → redirect to /login without it
 *   - We inject the cookie directly via addCookies() — no login round-trip needed
 *
 * Seed data used (from prisma/seed.ts):
 *   - RES-001: status=PLACED (has active placement)
 *   - RES-021: status=ACTIVE (unplaced, no placement)
 */

const BASE_URL = 'http://localhost:3101'

/** Add a resident_code cookie directly — faster than going through /login */
async function setResidentCookie(page: import('@playwright/test').Page, code: string) {
  await page.context().addCookies([
    {
      name: 'resident_code',
      value: code,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    portalLocaleCookie('de'),
  ])
}

// =============================================================================
// Auth guard — all portal sub-pages redirect when no resident cookie
// =============================================================================

test.describe('Portal auth guard', () => {
  // Override storageState — empty (no staff session, no resident cookie)
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const path of [
    '/portal/preferences',
    '/portal/transfer',
    '/portal/report',
    '/portal/chores',
  ]) {
    test(`${path} redirects to /login without resident cookie`, async ({ page }) => {
      await page.goto(path)
      // Middleware redirects /portal/* → /portal → /login
      // Use pathname-exact predicate to avoid early match on /portal/sub-page URLs
      await page.waitForURL(
        (url) => {
          const p = new URL(url).pathname
          return p === '/login' || p === '/portal'
        },
        { timeout: 10_000 },
      )
      const url = page.url()
      expect(url).toMatch(/\/(login|portal)(\?.*)?$/)
      expect(url).not.toContain(path)
    })
  }
})

// =============================================================================
// Portal Preferences (/portal/preferences)
// =============================================================================

test.describe('Portal Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await setResidentCookie(page, 'RES-001')
  })

  test('loads preferences form for placed resident', async ({ page }) => {
    await page.goto('/portal/preferences')

    await expect(page).toHaveURL('/portal/preferences', { timeout: 15_000 })
    // Heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('preferences form contains sleep schedule field', async ({ page }) => {
    await page.goto('/portal/preferences')

    // Sleep schedule select (from PreferencesForm)
    await expect(
      page.locator('select[name="sleepSchedule"], input[name="sleepSchedule"]').first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('preferences form has a submit button', async ({ page }) => {
    await page.goto('/portal/preferences')

    await expect(page.getByRole('button', { name: /speichern|aktualisieren|senden/i })).toBeVisible(
      { timeout: 15_000 },
    )
  })

  test('back link navigates to portal dashboard', async ({ page }) => {
    await page.goto('/portal/preferences')

    const backLink = page.getByRole('link', { name: /zurück|mein bereich/i }).first()
    await expect(backLink).toBeVisible({ timeout: 15_000 })
    await backLink.click()
    await page.waitForURL('/portal', { timeout: 10_000 })
  })
})

// =============================================================================
// Portal Report (/portal/report)
// =============================================================================

test.describe('Portal Report', () => {
  test.beforeEach(async ({ page }) => {
    await setResidentCookie(page, 'RES-001')
  })

  test('loads report page for placed resident', async ({ page }) => {
    await page.goto('/portal/report')

    await expect(page).toHaveURL('/portal/report', { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('always shows emergency contact notice', async ({ page }) => {
    await page.goto('/portal/report')

    // Emergency notice is always present regardless of placement status
    await expect(page.locator('text=/112|Notfall|emergency/i').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shows report form for placed resident', async ({ page }) => {
    await page.goto('/portal/report')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
    // Category / templates first; the <form> mounts after a category is chosen.
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('shows no-placement message for unplaced resident', async ({ page }) => {
    await setResidentCookie(page, 'RES-021')
    await page.goto('/portal/report')

    // No placement → informational message, no report form
    // Text: "Du hast noch keine Unterkunft zugewiesen bekommen."
    await expect(page.getByText(/keine.*unterkunft|kein.*platz|nicht platziert/i)).toBeVisible({
      timeout: 15_000,
    })
  })
})

// =============================================================================
// Portal Transfer (/portal/transfer)
// =============================================================================

test.describe('Portal Transfer', () => {
  test.beforeEach(async ({ page }) => {
    await setResidentCookie(page, 'RES-001')
  })

  test('loads transfer page for placed resident', async ({ page }) => {
    await page.goto('/portal/transfer')

    await expect(page).toHaveURL('/portal/transfer', { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('shows transfer form or pending state for placed resident', async ({ page }) => {
    await page.goto('/portal/transfer')

    // Either the form textarea is shown or the "request submitted" state.
    // PORTAL_LABELS.transfer.pendingTitle === 'Anfrage eingereicht'.
    const hasReasonField = await page
      .locator('#reason')
      .isVisible()
      .catch(() => false)
    const hasPending = await page
      .getByRole('heading', { name: /Anfrage eingereicht/i })
      .isVisible()
      .catch(() => false)

    expect(hasReasonField || hasPending).toBe(true)
  })

  test('shows no-placement message for unplaced resident', async ({ page }) => {
    await setResidentCookie(page, 'RES-021')
    await page.goto('/portal/transfer')

    // Text: "Du hast noch keine Unterkunft zugewiesen bekommen."
    await expect(page.getByText(/keine.*unterkunft|kein.*platz|nicht platziert/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('transfer form has reason field', async ({ page }) => {
    await page.goto('/portal/transfer')

    // Only if a form is shown (not the "request submitted" state)
    // The reason textarea has id="reason" (no name attribute)
    const hasPending = await page
      .getByRole('heading', { name: /Anfrage eingereicht/i })
      .isVisible()
      .catch(() => false)

    if (!hasPending) {
      await expect(page.locator('#reason')).toBeVisible({ timeout: 10_000 })
    }
  })
})

// =============================================================================
// Portal Chores (/portal/chores)
// =============================================================================

test.describe('Portal Chores', () => {
  test.beforeEach(async ({ page }) => {
    await setResidentCookie(page, 'RES-001')
  })

  test('loads chores page for placed resident', async ({ page }) => {
    await page.goto('/portal/chores')

    await expect(page).toHaveURL('/portal/chores', { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('shows create chore button', async ({ page }) => {
    await page.goto('/portal/chores')

    await expect(page.getByRole('link', { name: /neu|erstellen|hinzufügen|\+/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shows no-placement message for unplaced resident', async ({ page }) => {
    await setResidentCookie(page, 'RES-021')
    await page.goto('/portal/chores')

    // No placement → chores page still loads but shows info message
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
    // Should show some indication there's no placement
    await expect(page.getByText(/kein.*platz|nicht platziert|keine.*unterkunft/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('create chore link points to /portal/chores/new', async ({ page }) => {
    await page.goto('/portal/chores')

    const link = page.getByRole('link', { name: /neu|erstellen|hinzufügen|\+/i }).first()
    await expect(link).toHaveAttribute('href', /\/portal\/chores\/new/)
  })
})

// =============================================================================
// Portal navigation
// =============================================================================

test.describe('Portal navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setResidentCookie(page, 'RES-001')
  })

  test('portal dashboard shows navigation links to key pages', async ({ page }) => {
    await page.goto('/portal')

    await expect(page).toHaveURL('/portal', { timeout: 15_000 })

    // Nav links visible (either in sidebar or quick actions)
    const prefLink = page.locator('a[href="/portal/preferences"]:visible').first()
    const reportLink = page.locator('a[href="/portal/report"]:visible').first()

    await expect(prefLink).toBeVisible({ timeout: 15_000 })
    await expect(reportLink).toBeVisible({ timeout: 15_000 })
  })

  test('portal pages show back link to dashboard', async ({ page }) => {
    for (const path of ['/portal/preferences', '/portal/report', '/portal/transfer']) {
      await page.goto(path)
      await expect(page).toHaveURL(path, { timeout: 15_000 })

      const backLink = page.getByRole('link', { name: /zurück|mein bereich/i }).first()
      await expect(backLink).toBeVisible({ timeout: 10_000 })
    }
  })
})
