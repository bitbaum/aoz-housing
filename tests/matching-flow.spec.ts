import { test, expect } from '@playwright/test'

// storageState from playwright.config handles staff auth.
//
// Seed data used (from prisma/seed.ts):
//   - RES-008 to RES-013: status=ACTIVE (unplaced, no placement)
//   - ZH-001 to ZH-010+: housing units with available spots

test.describe('Matching page structure', () => {
  test('shows two-panel layout with resident selector and unit panel', async ({ page }) => {
    await page.goto('/matching')

    await expect(page.locator('h1, h2').first()).toContainText(/Matching/i)
    await expect(page.getByText(/Unplatzierte Bewohner/i).first()).toBeVisible()
  })

  test('shows unplaced residents list or empty state', async ({ page }) => {
    await page.goto('/matching')

    const hasResidents = await page.getByRole('link', { name: 'Passend' }).count() > 0
    const hasEmptyState = await page
      .getByText(/Keine Bewohner|Alle Bewohner sind platziert/i)
      .isVisible()
      .catch(() => false)

    expect(hasResidents || hasEmptyState).toBe(true)
  })

  test('right panel prompts to select a resident before any is chosen', async ({ page }) => {
    await page.goto('/matching')

    const hasPrompt = await page.getByText(/Wählen Sie einen Bewohner/i).isVisible().catch(() => false)
    const hasUnits = await page.getByText(/Verfügbare Unterkünfte/i).isVisible().catch(() => false)

    expect(hasPrompt || hasUnits).toBe(true)
  })
})

test.describe('Resident selection', () => {
  test('clicking "Passend" loads compatibility scores for that resident', async ({ page }) => {
    await page.goto('/matching')

    const matchingBtn = page.getByRole('link', { name: 'Passend' }).first()
    if ((await matchingBtn.count()) === 0) {
      await expect(page.getByText(/Alle Bewohner|Keine Bewohner/i)).toBeVisible()
      return
    }

    await matchingBtn.click()

    // URL gains ?resident= param
    await expect(page).toHaveURL(/[?&]resident=/, { timeout: 15_000 })

    // Right panel switches to match results
    await expect(page.getByText(/Matches für/i)).toBeVisible()
  })

  test('selected resident button changes to "Ausgewählt"', async ({ page }) => {
    await page.goto('/matching')

    const matchingBtns = page.getByRole('link', { name: 'Passend' })
    if ((await matchingBtns.count()) === 0) return

    await matchingBtns.first().click()
    await expect(page).toHaveURL(/[?&]resident=/, { timeout: 15_000 })

    // The clicked resident now shows "Ausgewählt"
    await expect(page.getByRole('link', { name: 'Ausgewählt' })).toBeVisible()
  })

  test('match results include score percentages', async ({ page }) => {
    await page.goto('/matching')

    const matchingBtn = page.getByRole('link', { name: 'Passend' }).first()
    if ((await matchingBtn.count()) === 0) return

    await matchingBtn.click()
    await expect(page).toHaveURL(/[?&]resident=/, { timeout: 15_000 })
    await expect(page.getByText(/Matches für/i)).toBeVisible()

    // At least one unit card should show a percentage score
    const scorePattern = /\d{1,3}%/
    const scoreLocator = page.getByText(scorePattern)
    await expect(scoreLocator.first()).toBeVisible({ timeout: 10_000 })
  })

  test('Standard / Fast Mode toggle is visible after selecting a resident', async ({ page }) => {
    await page.goto('/matching')

    const matchingBtn = page.getByRole('link', { name: 'Passend' }).first()
    if ((await matchingBtn.count()) === 0) return

    await matchingBtn.click()
    await expect(page).toHaveURL(/[?&]resident=/, { timeout: 15_000 })

    await expect(page.getByRole('link', { name: 'Standard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Fast Mode' })).toBeVisible()
  })

  test('Fast Mode toggle updates URL and preserves resident param', async ({ page }) => {
    await page.goto('/matching')

    const matchingBtn = page.getByRole('link', { name: 'Passend' }).first()
    if ((await matchingBtn.count()) === 0) return

    await matchingBtn.click()
    await expect(page).toHaveURL(/[?&]resident=/, { timeout: 15_000 })

    await page.getByRole('link', { name: 'Fast Mode' }).click()
    await expect(page).toHaveURL(/mode=fast/, { timeout: 10_000 })
    await expect(page).toHaveURL(/resident=/)
    await expect(page.getByText(/Matches für/i)).toBeVisible()
  })
})

test.describe('Resident search / filter', () => {
  test('searching with a non-matching string shows empty state', async ({ page }) => {
    await page.goto('/matching')

    const hasResidents = await page.getByRole('link', { name: 'Passend' }).count() > 0
    if (!hasResidents) return

    await page.locator('input[name="q"]').fill('XYZNONEXISTENT999')
    await page.getByRole('button', { name: 'Suchen' }).click()

    await expect(page.getByText(/Keine Bewohner|keine.*Suche/i)).toBeVisible({ timeout: 10_000 })
  })

  test('clearing search restores resident list', async ({ page }) => {
    await page.goto('/matching')

    const initialCount = await page.getByRole('link', { name: 'Passend' }).count()
    if (initialCount === 0) return

    await page.locator('input[name="q"]').fill('XYZNONEXISTENT999')
    await page.getByRole('button', { name: 'Suchen' }).click()
    await expect(page.getByText(/Keine Bewohner|keine.*Suche/i)).toBeVisible({ timeout: 10_000 })

    await page.locator('input[name="q"]').clear()
    await page.getByRole('button', { name: 'Suchen' }).click()

    // Should restore original count
    await expect(page.getByRole('link', { name: 'Passend' }).first()).toBeVisible({ timeout: 10_000 })
    const restoredCount = await page.getByRole('link', { name: 'Passend' }).count()
    expect(restoredCount).toBe(initialCount)
  })
})

test.describe('Unit mode (who fits here)', () => {
  test('navigating with ?unit=<invalid> does not crash the page', async ({ page }) => {
    await page.goto('/matching?unit=nonexistent-id')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('unit mode shows "Passende Bewohner" panel when a valid unit is selected', async ({ page }) => {
    // Get a real unit ID from the housing list
    const response = await page.request.get('/api/export/units').catch(() => null)
    // Navigate to housing list to get a unit ID from the page
    await page.goto('/housing')
    const firstUnitLink = page.getByRole('link').filter({ hasText: /ZH-/ }).first()
    if ((await firstUnitLink.count()) === 0) return

    const href = await firstUnitLink.getAttribute('href')
    const unitId = href?.split('/housing/')[1]?.split('/')[0]
    if (!unitId) return

    await page.goto(`/matching?unit=${unitId}`)

    // Unit mode panel renders
    await expect(page.getByText(/Passende Bewohner|Wählen Sie/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Full placement flow', () => {
  test('create resident → see matches → place in unit', async ({ page }) => {
    // 1. Create a new resident using the form (unique code prevents conflicts)
    const code = `E2E-M-${Date.now()}`
    await page.goto('/residents/new')

    await page.locator('input[name="code"]').fill(code)
    await page.locator('select[name="ageRange"]').selectOption('ADULT')
    await page.locator('select[name="gender"]').selectOption('MALE')
    await page.locator('select[name="familyStatus"]').selectOption('SINGLE')
    await page.locator('select[name="sleepSchedule"]').selectOption('STANDARD')
    await page.locator('select[name="socialStyle"]').selectOption('MODERATE')
    await page.locator('select[name="smokingStatus"]').selectOption('NON_SMOKER')
    await page.locator('select[name="mobilityNeeds"]').selectOption('NONE')

    await page.getByRole('button', { name: /Matching|Speichern/i }).click()

    // 2. Redirects to matching with resident pre-selected
    await expect(page).toHaveURL(/matching/, { timeout: 30_000 })
    await expect(page).toHaveURL(/resident=/)

    // Right panel shows matches for the new resident
    await expect(page.getByText(/Matches für/)).toBeVisible({ timeout: 15_000 })
    // The code appears in several places (toast, step indicator, heading) — any visible one is fine
    await expect(page.getByText(code).first()).toBeVisible()

    // 3. Check for available placement
    const placeBtn = page.getByRole('button', { name: /Platzieren/i }).first()
    if ((await placeBtn.count()) === 0) {
      // No units with available spots — acceptable test environment state
      return
    }

    // 4. Submit placement
    await placeBtn.click()

    // placeResident action redirects to /residents/:id?placed=true
    await expect(page).toHaveURL(/\/residents\/.*\?placed=true/, { timeout: 30_000 })
    const residentId = page.url().match(/\/residents\/([^/?]+)/)![1]

    // 5. Resident detail page shows a "placed" confirmation
    await expect(page.getByText(/Platziert|platziert|placed/i).first()).toBeVisible()

    // 6. Resident no longer appears in the UNPLACED list on the matching page.
    // Placed residents intentionally still show in the "Platzierte Bewohner"
    // what-if section — their action link reads "Vergleichen", while unplaced
    // residents get a "Passend" link with the same href.
    await page.goto('/matching')
    const actionLink = page.locator(`a[href="/matching?resident=${residentId}"]`)
    await expect(actionLink).toBeVisible({ timeout: 15_000 })
    await expect(actionLink).toHaveText(/Vergleichen/)
  })
})
