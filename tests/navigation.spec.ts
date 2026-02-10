import { test, expect } from '@playwright/test'

test.describe('Navigation — admin pages load', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AOZ/)
  })

  test('residents list loads', async ({ page }) => {
    await page.goto('/residents')
    await expect(page.locator('h1, h2').first()).toContainText(/Bewohner/i)
  })

  test('housing list loads', async ({ page }) => {
    await page.goto('/housing')
    await expect(page.locator('h1, h2').first()).toContainText(/Unterkünfte/i)
  })

  test('incidents list loads', async ({ page }) => {
    await page.goto('/incidents')
    await expect(page.locator('h1, h2').first()).toContainText(/Vorfälle/i)
  })

  test('placements list loads', async ({ page }) => {
    await page.goto('/placements')
    await expect(page.locator('h1, h2').first()).toContainText(/Platzierung/i)
  })

  test('matching page loads', async ({ page }) => {
    await page.goto('/matching')
    await expect(page.locator('h1, h2').first()).toContainText(/Matching/i)
  })

  test('maintenance page loads', async ({ page }) => {
    await page.goto('/maintenance')
    await expect(page.locator('h1, h2').first()).toContainText(/Wartung/i)
  })
})
