import { test, expect } from '@playwright/test'
import { ensureStaffLogin } from './helpers'

test.setTimeout(60_000)

test.beforeEach(async ({ page }) => {
  await ensureStaffLogin(page)
})

test.describe('Navigation — admin pages load', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AOZ/)
  })

  test('residents list loads', async ({ page }) => {
    await page.goto('/residents')
    await expect(page.getByRole('heading', { level: 1, name: /Bewohner/i })).toBeVisible({ timeout: 30_000 })
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
