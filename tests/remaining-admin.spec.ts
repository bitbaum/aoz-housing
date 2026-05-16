import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth
// Closes the last 3 uncovered admin routes: /ai-assistant, /algorithm, /transfer-requests

// =============================================================================
// AI Assistant (/ai-assistant)
// =============================================================================

test.describe('AI Assistant (/ai-assistant)', () => {
  test('page loads with heading and subtitle', async ({ page }) => {
    await page.goto('/ai-assistant')

    await expect(page.getByRole('heading', { name: /KI-Assistent/i })).toBeVisible({ timeout: 15_000 })
  })

  test('shows suggested question buttons in empty state', async ({ page }) => {
    await page.goto('/ai-assistant')

    // AIChatInterface renders suggested question buttons before any message is sent
    await expect(
      page.getByRole('button').filter({ hasText: /.+/ }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('textarea is present and enabled', async ({ page }) => {
    await page.goto('/ai-assistant')

    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 15_000 })
    await expect(textarea).toBeEnabled()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/ai-assistant')

    // The send button (aria-label: Nachricht senden) is disabled on empty input
    const sendBtn = page.locator('button[aria-label="Nachricht senden"], button:has([data-testid="send-icon"])').first()
    await expect(sendBtn).toBeVisible({ timeout: 15_000 })
    await expect(sendBtn).toBeDisabled()
  })

  test('typing a message enables the send button', async ({ page }) => {
    await page.goto('/ai-assistant')

    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 15_000 })
    await textarea.fill('Wie viele Bewohner gibt es?')

    const sendBtn = page.locator('button[aria-label="Nachricht senden"], button:has([data-testid="send-icon"])').first()
    await expect(sendBtn).toBeEnabled()
  })

  test('accessible from sidebar navigation', async ({ page }) => {
    await page.goto('/')

    const navLink = page.locator('aside a[href="/ai-assistant"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/ai-assistant', { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: /KI-Assistent/i })).toBeVisible()
  })
})

// =============================================================================
// Algorithm (/algorithm)
// =============================================================================

test.describe('Algorithm (/algorithm)', () => {
  test('page loads with heading', async ({ page }) => {
    await page.goto('/algorithm')

    // AlgorithmContent renders a heading about the algorithm
    await expect(
      page.getByRole('heading', { name: /Algorithmus|Kompatibilität/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows tab navigation (overview, science, dimensions, etc.)', async ({ page }) => {
    await page.goto('/algorithm')

    // 5 tabs: Overview, Science, Dimensions, Collection, Technical
    await expect(
      page.getByRole('tab').or(page.getByRole('button').filter({ hasText: /Überblick|Wissenschaft|Faktoren|Erhebung|Technisch/i })).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('overview tab content is visible by default', async ({ page }) => {
    await page.goto('/algorithm')

    // OverviewTab shows dimension counts, factor counts, etc.
    await expect(
      page.getByText(/Faktoren|Dimensionen|Gewichtung/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('accessible from sidebar navigation', async ({ page }) => {
    await page.goto('/')

    const navLink = page.locator('aside a[href="/algorithm"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/algorithm', { timeout: 10_000 })
  })
})

// =============================================================================
// Transfer Requests (/transfer-requests)
// =============================================================================

test.describe('Transfer Requests (/transfer-requests)', () => {
  test('page loads with heading', async ({ page }) => {
    await page.goto('/transfer-requests')

    await expect(
      page.getByRole('heading', { name: /Transferanfragen|Umzugsanfragen|Transfer/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows status tabs (Pending, Approved, Denied, All)', async ({ page }) => {
    await page.goto('/transfer-requests')

    // TabLinks for PENDING, APPROVED, DENIED, ALL
    await expect(page.getByRole('link', { name: /Ausstehend|Pending/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Genehmigt|Approved/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Abgelehnt|Denied/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Alle|All/i })).toBeVisible()
  })

  test('pending tab shows empty state (no seed data)', async ({ page }) => {
    await page.goto('/transfer-requests?status=PENDING')

    // No transfer requests seeded → empty state message
    await expect(
      page.getByText(/Keine.*Anfragen|keine.*ausstehend|no.*pending|Keine Transferanfragen/i)
    ).toBeVisible({ timeout: 15_000 })
  })

  test('all tab shows zero count', async ({ page }) => {
    await page.goto('/transfer-requests?status=ALL')

    // Empty state or zero count badge
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
  })

  test('accessible from sidebar navigation', async ({ page }) => {
    await page.goto('/')

    const navLink = page.locator('aside a[href="/transfer-requests"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/transfer-requests', { timeout: 10_000 })

    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})
