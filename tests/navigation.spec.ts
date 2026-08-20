import { test, expect } from '@playwright/test'
import { BRAND } from '../src/lib/config/brand'
import { RESIDENT_LIST_LABELS } from '../src/lib/constants/labels/ui'

// storageState from playwright.config handles staff auth

test.describe('Navigation — admin pages load', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(new RegExp(BRAND.shortName))
  })

  test('residents list loads', async ({ page }) => {
    await page.goto('/residents')
    // Asserted against the label SSOT rather than a hardcoded German word.
    // Hardcoding it is what put this suite — and every deploy behind it — on
    // red when the product renamed residents to Klient*innen.
    await expect(
      page.getByRole('heading', { level: 1, name: RESIDENT_LIST_LABELS.title })
    ).toBeVisible({ timeout: 30_000 })
  })

  test('housing list loads', async ({ page }) => {
    await page.goto('/housing')
    await expect(page.getByRole('heading', { level: 1, name: /Unterkünfte/i })).toBeVisible({ timeout: 30_000 })
  })

  test('incidents list loads', async ({ page }) => {
    await page.goto('/incidents')
    await expect(page.getByRole('heading', { level: 1, name: /Vorfälle/i })).toBeVisible({ timeout: 30_000 })
  })

  test('placements list loads', async ({ page }) => {
    await page.goto('/placements')
    await expect(page.getByRole('heading', { level: 1, name: /Platzierung/i })).toBeVisible({ timeout: 30_000 })
  })

  test('matching page loads', async ({ page }) => {
    await page.goto('/matching')
    await expect(page.getByRole('heading', { level: 1, name: /Matching/i })).toBeVisible({ timeout: 30_000 })
  })

  test('maintenance page loads', async ({ page }) => {
    await page.goto('/maintenance')
    await expect(page.getByRole('heading', { level: 1, name: /Wartung/i })).toBeVisible({ timeout: 30_000 })
  })
})
