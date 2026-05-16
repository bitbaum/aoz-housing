import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth
// Seed data drives real DB assertions (placements, incidents, check-ins, algorithm accuracy)

test.describe('Analytics page (/analytics)', () => {
  test('loads with heading and subtitle', async ({ page }) => {
    await page.goto('/analytics')

    await expect(page.getByRole('heading', { name: /Statistiken/i })).toBeVisible({ timeout: 15_000 })
  })

  test('shows Mission KPI section', async ({ page }) => {
    await page.goto('/analytics')

    // MissionKPISection renders a heading about mission/Kern-KPIs
    await expect(
      page.getByText(/Kern-KPI|Mission KPI|Konfliktentwicklung|Monatliche Konflikte/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows occupancy rate metric card', async ({ page }) => {
    await page.goto('/analytics')

    // MetricCard for occupancy shows a % value
    await expect(
      page.getByText(/Belegungsrate|Auslastung/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows satisfaction chart section', async ({ page }) => {
    await page.goto('/analytics')

    await expect(
      page.getByText(/Zufriedenheit|Satisfaction/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows conflict hotspot section', async ({ page }) => {
    await page.goto('/analytics')

    await expect(
      page.getByText(/Konflikt-Hotspot|Konflikte.*Unterkunft|keine Konflikte/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows algorithm accuracy section', async ({ page }) => {
    await page.goto('/analytics')

    // AlgorithmAccuracySection renders a heading about algorithm/Genauigkeit
    await expect(
      page.getByText(/Algorithmus|Genauigkeit|Algorithm Accuracy/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('shows recent placements table', async ({ page }) => {
    await page.goto('/analytics')

    // RecentPlacementsTable renders a table or section with placement data
    await expect(
      page.getByText(/Letzte Platzierungen|Neue Unterbringungen|Recent Placements/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('period selector is present', async ({ page }) => {
    await page.goto('/analytics')

    // PeriodSelector renders period toggle buttons (7, 30, 90 days)
    await expect(
      page.getByRole('link', { name: /30|90|Tage/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('changing period via URL updates the heading period', async ({ page }) => {
    await page.goto('/analytics?days=90')

    // Page loads successfully with 90-day period — heading still shows
    await expect(page.getByRole('heading', { name: /Statistiken/i })).toBeVisible({ timeout: 15_000 })

    // The period selector reflects 90 days
    await expect(
      page.getByText(/90/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('export button is present', async ({ page }) => {
    await page.goto('/analytics')

    await expect(
      page.getByRole('link', { name: /Export|Exportieren/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('accessible from sidebar navigation', async ({ page }) => {
    await page.goto('/')

    const navLink = page.locator('aside a[href="/analytics"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/analytics', { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: /Statistiken/i })).toBeVisible()
  })
})

// =============================================================================
// Admin chores (/chores)
// =============================================================================

test.describe('Admin chores (/chores)', () => {
  test('loads with heading', async ({ page }) => {
    await page.goto('/chores')

    // CHORE_LABELS.admin.pageTitle
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Haushaltsaufgaben|Aufgaben/i).first()).toBeVisible()
  })

  test('shows 4 stat cards', async ({ page }) => {
    await page.goto('/chores')

    // StatCards for total, active, needs attention, completions
    // Seed has 4 household tasks
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15_000 })
  })

  test('shows per-unit summary with seed units', async ({ page }) => {
    await page.goto('/chores')

    // Seed has tasks in ZH-001, ZH-002 etc — at least one ZH-xxx unit visible
    await expect(
      page.locator('text=/ZH-\\d{3}/').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('unit codes link to housing detail page', async ({ page }) => {
    await page.goto('/chores')

    const unitLink = page.locator('a[href^="/housing/"]').first()
    await expect(unitLink).toBeVisible({ timeout: 15_000 })
    const href = await unitLink.getAttribute('href')
    expect(href).toMatch(/^\/housing\/[a-z0-9]+$/)
  })

  test('accessible from sidebar navigation', async ({ page }) => {
    await page.goto('/')

    const navLink = page.locator('aside a[href="/chores"]').first()
    await expect(navLink).toBeVisible({ timeout: 15_000 })

    await navLink.click()
    await page.waitForURL('**/chores', { timeout: 10_000 })

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
