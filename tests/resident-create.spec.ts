import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.beforeEach(async ({ page }) => {
  await ensureStaffLogin(page)
})

test.describe('Resident creation flow', () => {
  test('new resident form loads with all sections', async ({ page }) => {
    await page.goto('/residents/new')

    // Form sections visible
    await expect(page.getByText('Grunddaten')).toBeVisible()
    await expect(page.getByText('Lebensstil')).toBeVisible()
    await expect(page.getByText('Soziales')).toBeVisible()
    await expect(page.getByText('Praktisches')).toBeVisible()

    // Submit button present
    await expect(page.getByRole('button', { name: /Matching|Speichern/i })).toBeVisible()
  })

  test('form validates required fields', async ({ page }) => {
    await page.goto('/residents/new')

    // Try to submit empty form — code is required
    const codeInput = page.locator('input[name="code"]')
    await codeInput.fill('')

    // Click submit
    await page.getByRole('button', { name: /Matching|Speichern/i }).click()

    // Should stay on the same page (validation prevents navigation)
    await expect(page).toHaveURL(/residents\/new/)
  })

  test('can fill out and submit resident form', async ({ page }) => {
    await page.goto('/residents/new')

    // Generate unique code to avoid conflicts
    const code = `E2E-${Date.now()}`

    // Fill required fields
    await page.locator('input[name="code"]').fill(code)

    // Select age range
    await page.locator('select[name="ageRange"]').selectOption('ADULT')

    // Select gender
    await page.locator('select[name="gender"]').selectOption('MALE')

    // Select family status
    await page.locator('select[name="familyStatus"]').selectOption('SINGLE')

    // Select sleep schedule
    await page.locator('select[name="sleepSchedule"]').selectOption('STANDARD')

    // Select social style
    await page.locator('select[name="socialStyle"]').selectOption('MODERATE')

    // Select smoking status
    await page.locator('select[name="smokingStatus"]').selectOption('NON_SMOKER')

    // Select mobility
    await page.locator('select[name="mobilityNeeds"]').selectOption('NONE')

    // Submit form
    await page.getByRole('button', { name: /Matching|Speichern/i }).click()

    // Should redirect to matching page with the new resident
    await page.waitForURL(/matching/, { timeout: 10000 })
    await expect(page.url()).toContain('matching')
  })
})
