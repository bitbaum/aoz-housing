import { expect, type Locator, type Page } from '@playwright/test'
import { BRAND } from '../src/lib/config/brand'
import { LOGIN_LABELS } from '../src/lib/constants/labels'
import { LOCALE_COOKIE } from '../src/lib/i18n/locales'

const STAFF_CODE = process.env.E2E_STAFF_CODE || `${BRAND.codePrefix}ADMIN1`

/**
 * Ensure the page has a valid staff session.
 * With storageState in playwright.config, we should already be authenticated.
 * This function falls back to UI login if the session is missing.
 */
export async function ensureStaffLogin(page: Page) {
  // Navigate to dashboard — middleware will redirect to /login if no session
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // If we got redirected to login, do a UI login
  if (page.url().includes('/login')) {
    await openCodeLoginForm(page)
    await page.locator('#code').fill(STAFF_CODE)
    await page.locator('form').getByRole('button', { name: /^Anmelden$/i }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
  }
}

async function waitForLoginDoors(page: Page) {
  await expect(page.locator('#email, #code').first()).toBeVisible({ timeout: 15_000 })
}

/**
 * The login page's primary door depends on the brand: AOZ/AOZH open on the
 * printed code, WG on email. Both doors stay one toggle away. Idempotent.
 */
export async function openCodeLoginForm(page: Page) {
  await waitForLoginDoors(page)
  const codeInput = page.locator('#code')
  if (!(await codeInput.isVisible())) {
    await page.getByRole('button', { name: LOGIN_LABELS.useCode }).click()
    await expect(codeInput).toBeVisible()
  }
}

export async function openEmailLoginForm(page: Page) {
  await waitForLoginDoors(page)
  const emailInput = page.locator('#email')
  if (!(await emailInput.isVisible())) {
    await page.getByRole('button', { name: LOGIN_LABELS.useEmail }).click()
    await expect(emailInput).toBeVisible()
  }
}

/** Short intake hides matching detail fields behind this control. */
export async function expandResidentIntakeDetails(page: Page) {
  const more = page.getByRole('button', { name: 'Weitere Angaben' })
  if (await more.isVisible()) {
    await more.click()
    await expect(page.locator('select[name="socialStyle"]')).toBeVisible()
  }
}

/** Portal dictionaries follow Accept-Language unless this cookie is set. */
export function portalLocaleCookie(locale = 'de') {
  return {
    name: LOCALE_COOKIE,
    value: locale,
    domain: 'localhost',
    path: '/',
  }
}

/**
 * Find `href` in the admin chrome (header nav, then footer) and assert it is
 * reachable.
 *
 * The fixed `<aside>` sidebar was removed in May 2026 ("megamenu is sole
 * desktop nav"); the persistent desktop chrome is now a `<header>` holding
 * top-level links plus dropdown groups (see MEGAMENU_GROUPS) and a `<footer>`
 * carrying the secondary links. Links inside a dropdown group only exist in
 * the DOM once the group is open, so open groups until the link appears.
 *
 * Scoped to *visible* chrome on purpose: MobileNav renders a second `<header>`
 * plus the full link list into the DOM at every viewport and merely hides them
 * with CSS, so an unscoped locator matches a hidden element and the assertion
 * fails on visibility rather than on reachability.
 */
export async function findAdminNavLink(page: Page, href: string): Promise<Locator> {
  const chrome = page.locator('header, footer')
  // `:visible` on the link itself, not just its container: the header keeps its
  // secondary links in the DOM and hides them below 2xl, and MobileNav renders
  // a second (hidden) header with the full link list at every viewport.
  const selector = `a[href="${href}"]:visible`

  if ((await chrome.locator(selector).count()) === 0) {
    const groups = page.locator('header nav button[aria-haspopup="true"]:visible')
    const groupCount = await groups.count()
    for (let i = 0; i < groupCount; i++) {
      // click(): the megamenu opens on intent (click), never on hover-from-rest.
      await groups.nth(i).click()
      // The panel mounts on the next React render, so wait for it rather than
      // reading the count synchronously.
      await chrome
        .locator(selector)
        .first()
        .waitFor({ state: 'visible', timeout: 2_000 })
        .catch(() => undefined)
      if ((await chrome.locator(selector).count()) > 0) break
      await page.keyboard.press('Escape') // close before probing the next group
    }
  }

  // System links (Einstellungen, Algorithmus, Hilfe) live in the user menu
  // dropdown — one SSOT (SYSTEM_LINKS), not the header row.
  if ((await chrome.locator(selector).count()) === 0) {
    await page.getByRole('button', { name: 'Benutzermenü' }).click()
    await chrome
      .locator(selector)
      .first()
      .waitFor({ state: 'visible', timeout: 2_000 })
      .catch(() => undefined)
  }

  const link = chrome.locator(selector).first()
  await expect(link).toBeVisible({ timeout: 15_000 })
  return link
}

/**
 * Assert the page currently rendered is the application's 404 page.
 *
 * Deliberately checks the rendered UI rather than `response.status()`: every
 * admin segment has a `loading.tsx`, so Next.js opens a Suspense boundary and
 * flushes the response shell (status 200) before the page body runs
 * `notFound()`. The status line is already committed by then. Keeping the
 * loading skeletons is the right product call, so the guarantee worth
 * asserting is the one users actually experience — they land on the 404 page.
 */
export async function expectNotFoundPage(page: Page) {
  await expect(
    page.getByRole('heading', { name: /Seite nicht gefunden/i })
  ).toBeVisible({ timeout: 15_000 })
}
