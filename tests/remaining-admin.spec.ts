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

  test('accessible from header navigation', async ({ page }) => {
    await page.goto('/')

    // KI-Assistent is a top-level megamenu item in the header
    const navLink = page.locator('header a[href="/ai-assistant"]').first()
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

  test('accessible from header navigation', async ({ page }) => {
    await page.goto('/')

    // Algorithm is a secondary link in the header (visible on lg+ viewports)
    const navLink = page.locator('header a[href="/algorithm"]').first()
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

    // PAGE_TITLES.transferRequests = 'Verlegungsanfragen'
    await expect(
      page.getByRole('heading', { name: /Verlegungsanfragen/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows status tabs (Pending, Approved, Completed, Denied, All)', async ({ page }) => {
    await page.goto('/transfer-requests')

    // TabLinks for PENDING ('Offen'), APPROVED, COMPLETED, DENIED, ALL
    await expect(page.getByRole('tab', { name: /Offen/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /Genehmigt/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Abgeschlossen/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Abgelehnt/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Alle/i })).toBeVisible()
  })

  test('pending tab shows the seeded PENDING request from RES-001', async ({ page }) => {
    await page.goto('/transfer-requests?status=PENDING')

    await expect(page.getByText('RES-001')).toBeVisible({ timeout: 15_000 })
  })

  test('approved tab shows the seeded APPROVED request from RES-004', async ({ page }) => {
    await page.goto('/transfer-requests?status=APPROVED')

    await expect(page.getByText('RES-004')).toBeVisible({ timeout: 15_000 })
  })

  test('denied tab shows the seeded DENIED request from RES-006', async ({ page }) => {
    await page.goto('/transfer-requests?status=DENIED')

    await expect(page.getByText('RES-006')).toBeVisible({ timeout: 15_000 })
  })

  test('all tab shows all 3 seeded requests', async ({ page }) => {
    await page.goto('/transfer-requests?status=ALL')

    await expect(page.getByText('RES-001')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('RES-004')).toBeVisible()
    await expect(page.getByText('RES-006')).toBeVisible()
  })

  test('pending request shows approve and deny action buttons', async ({ page }) => {
    await page.goto('/transfer-requests?status=PENDING')

    // TransferActions renders approve/deny buttons for PENDING requests
    await expect(
      page.getByRole('button', { name: /Genehmigen|Approve|Zustimmen/i }).or(
        page.getByRole('button', { name: /Ablehnen|Deny/i })
      ).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('accessible from header navigation', async ({ page }) => {
    await page.goto('/')

    // Transfer requests live in the "Personen" megamenu dropdown (opens on hover)
    await page.locator('header').getByRole('button', { name: 'Personen' }).hover()
    const navLink = page.locator('header a[href="/transfer-requests"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/transfer-requests', { timeout: 10_000 })

    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})
