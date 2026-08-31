import { test, expect } from '@playwright/test'
import { findAdminNavLink, expectNotFoundPage } from './helpers'

// storageState from playwright.config handles staff auth
// Seed data (prisma/seed.ts) provides 4 maintenance requests:
//   - "Dusche tropft"              → OPEN    (ZH-006)
//   - "Heizung Zimmer 2 defekt"    → ASSIGNED (ZH-002)
//   - "Steckdose funktioniert nicht" → COMPLETED (ZH-003)
//   - "Waschmaschine defekt"       → COMPLETED (ZH-004)

/**
 * First link to an actual maintenance *detail* page.
 *
 * `a[href^="/maintenance/"]` also matches the "Neue Anfrage" action in the page
 * header, which sorts first in the DOM — the detail-page tests were silently
 * asserting against /maintenance/new.
 */
function detailLink(page: import('@playwright/test').Page) {
  return page.locator('main a[href^="/maintenance/"]:not([href="/maintenance/new"])').first()
}

test.describe('Maintenance list (/maintenance)', () => {
  test('page loads with heading and new-request button', async ({ page }) => {
    await page.goto('/maintenance')

    await expect(page.getByRole('heading', { name: /Wartungsanfragen/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('link', { name: /Neue Anfrage|Neue Wartungsanfrage/i }),
    ).toBeVisible()
  })

  test('shows stat cards for open and urgent counts', async ({ page }) => {
    await page.goto('/maintenance')

    // StatCards contain labels from MAINTENANCE_STATUS_LABELS + MAINTENANCE_PRIORITY_LABELS
    await expect(page.getByText(/Offen/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('active tab shows open and assigned requests from seed', async ({ page }) => {
    await page.goto('/maintenance')

    // Seed has OPEN "Dusche tropft" and ASSIGNED "Heizung Zimmer 2 defekt"
    await expect(page.getByText('Dusche tropft')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Heizung Zimmer 2 defekt')).toBeVisible({ timeout: 15_000 })
  })

  test('completed tab shows completed requests from seed', async ({ page }) => {
    await page.goto('/maintenance?status=COMPLETED')

    // Seed has COMPLETED "Steckdose funktioniert nicht"
    await expect(page.getByText('Steckdose funktioniert nicht')).toBeVisible({ timeout: 15_000 })
  })

  test('all tab shows all requests', async ({ page }) => {
    await page.goto('/maintenance?status=all')

    await expect(page.getByText('Dusche tropft')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Steckdose funktioniert nicht')).toBeVisible({ timeout: 15_000 })
  })

  test('each request row links to its detail page', async ({ page }) => {
    await page.goto('/maintenance')

    const link = detailLink(page)
    await expect(link).toBeVisible({ timeout: 15_000 })

    const href = await link.getAttribute('href')
    expect(href).toMatch(/^\/maintenance\/[a-z0-9]+$/)
  })

  test('new-request link points to /maintenance/new', async ({ page }) => {
    await page.goto('/maintenance')

    const link = page.getByRole('link', { name: /Neue Anfrage|Neue Wartungsanfrage/i })
    await expect(link).toHaveAttribute('href', '/maintenance/new')
  })

  test('accessible from the header nav', async ({ page }) => {
    await page.goto('/')

    const navLink = await findAdminNavLink(page, '/maintenance')

    await navLink.click()
    await page.waitForURL('**/maintenance', { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: /Wartungsanfragen/i })).toBeVisible()
  })
})

test.describe('Maintenance new request (/maintenance/new)', () => {
  test('page loads with form heading', async ({ page }) => {
    await page.goto('/maintenance/new')

    await expect(
      page.getByRole('heading', { name: /Neue Wartungsanfrage|Wartungsanfrage erfassen/i }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('form has required fields: unit, category, title, description', async ({ page }) => {
    await page.goto('/maintenance/new')

    await expect(page.locator('select[name="housingUnitId"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('select[name="category"]')).toBeVisible()
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()
  })

  test('priority field defaults to NORMAL', async ({ page }) => {
    await page.goto('/maintenance/new')

    const priority = page.locator('select[name="priority"]')
    await expect(priority).toBeVisible({ timeout: 15_000 })
    await expect(priority).toHaveValue('NORMAL')
  })

  test('back link navigates to /maintenance', async ({ page }) => {
    await page.goto('/maintenance/new')

    const back = page.getByRole('link', { name: /Zurück|Wartungsanfragen/i }).first()
    await expect(back).toBeVisible({ timeout: 15_000 })
    await back.click()
    await page.waitForURL('**/maintenance', { timeout: 10_000 })
  })

  test('submitting empty form triggers validation', async ({ page }) => {
    await page.goto('/maintenance/new')

    await expect(page.locator('select[name="housingUnitId"]')).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole('button', { name: /Anfrage|Erstellen|Speichern|Senden/i })
      .last()
      .click()

    // HTML5 required validation or our summary block appears
    const hasAlert = await page
      .locator('[role="alert"]:not(.hidden)')
      .isVisible()
      .catch(() => false)
    const hasInvalidField = (await page.locator(':invalid').count()) > 0

    expect(hasAlert || hasInvalidField).toBe(true)
  })
})

test.describe('Maintenance detail (/maintenance/[id])', () => {
  test('detail page loads from list link', async ({ page }) => {
    await page.goto('/maintenance')

    const link = detailLink(page)
    await expect(link).toBeVisible({ timeout: 15_000 })

    const href = await link.getAttribute('href')
    await page.goto(href!)

    // Heading contains the request title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('detail page shows status badge', async ({ page }) => {
    await page.goto('/maintenance')

    const link = detailLink(page)
    const href = await link.getAttribute('href')
    await page.goto(href!)

    // Status badge (Offen / Zugewiesen / etc.)
    await expect(page.locator('.badge, [class*="badge"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('detail page shows housing unit link', async ({ page }) => {
    await page.goto('/maintenance')

    const link = detailLink(page)
    const href = await link.getAttribute('href')
    await page.goto(href!)

    // Housing unit code (ZH-xxx) appears as a link
    await expect(page.locator('a[href^="/housing/"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('back link returns to /maintenance', async ({ page }) => {
    await page.goto('/maintenance')

    const link = detailLink(page)
    const href = await link.getAttribute('href')
    await page.goto(href!)

    const back = page.getByRole('link', { name: /Zurück|Wartungsanfragen/i }).first()
    await expect(back).toBeVisible({ timeout: 15_000 })
    await back.click()
    await page.waitForURL('**/maintenance', { timeout: 10_000 })
  })

  test('completed request detail shows resolution info', async ({ page }) => {
    // Navigate directly to the completed tab and pick the first completed request
    await page.goto('/maintenance?status=COMPLETED')

    const link = detailLink(page)
    await expect(link).toBeVisible({ timeout: 15_000 })
    const href = await link.getAttribute('href')
    await page.goto(href!)

    // Completed requests show the resolution text
    await expect(page.getByText(/Abgeschlossen|Erledigt|Abschluss/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('nonexistent id shows the 404 page', async ({ page }) => {
    await page.goto('/maintenance/nonexistent-id-xyz')
    await expectNotFoundPage(page)
  })
})
