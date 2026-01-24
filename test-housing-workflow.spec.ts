import { test, expect } from '@playwright/test'

test('complete housing creation workflow', async ({ page }) => {
  // Step 1: Navigate to housing creation
  await page.goto('http://localhost:3000/housing/new')
  await page.waitForLoadState('networkidle')

  console.log('✓ Step 1: Loaded /housing/new')

  // Verify step indicator is visible (check for the numbered circles)
  await expect(page.locator('.w-8.h-8.rounded-full.bg-aoz-primary').first()).toBeVisible()
  await expect(page.getByText('Neue Unterkunft erstellen')).toBeVisible()

  // Step 2: Fill in building details
  const timestamp = Date.now()
  const buildingCode = `TEST-${timestamp}`

  await page.fill('input[name="code"]', buildingCode)
  await page.fill('input[name="address"]', 'Teststrasse 123, 8000 Zürich')

  console.log(`✓ Step 2: Filled building form with code: ${buildingCode}`)

  // Step 3: Submit and wait for redirect
  await page.click('button[type="submit"]:has-text("Weiter zu Zimmer & Betten")')

  // Wait for redirect to spots page
  await page.waitForURL(/\/housing\/[^\/]+\/spots\?new=1/)

  console.log('✓ Step 3: Redirected to spots page with ?new=1')

  // Step 4: Verify visual guide is shown
  await expect(page.getByText('Schritt 2 von 2: Zimmer und Betten einrichten')).toBeVisible()
  await expect(page.getByText('🏢 Gebäude')).toBeVisible()
  await expect(page.getByText('🚪 Zimmer')).toBeVisible()
  await expect(page.getByText('🛏️ Betten')).toBeVisible()

  console.log('✓ Step 4: Visual hierarchy guide is displayed')

  // Step 5: Fill in room creation form (green form)
  await page.fill('input[name="roomCode"]', 'Z1')
  await page.fill('input[name="bedCount"]', '3')
  await page.fill('input[name="squareMeters"]', '18.5')
  await page.fill('input[name="floor"]', '2')
  await page.fill('input[name="roomLabel"]', 'Zimmer Nord')

  console.log('✓ Step 5: Filled room creation form (Z1 with 3 beds)')

  // Step 6: Submit room creation
  await page.click('button[type="submit"]:has-text("Zimmer erstellen")')

  // Wait a bit and take screenshot to see what's happening
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/housing-workflow-after-submit.png', fullPage: true })

  console.log('✓ Step 6: Submitted room creation form')

  // Check the actual text on the page
  const bodyText = await page.textContent('body')
  console.log('Page contains "Vorhandene Plätze":', bodyText?.includes('Vorhandene Plätze'))

  // Look for the spots count
  const spotsMatch = bodyText?.match(/Vorhandene Plätze \((\d+)\)/)
  console.log('Spots count:', spotsMatch ? spotsMatch[1] : 'not found')

  // Step 7: Verify room and beds are displayed
  const spotsHeader = page.getByText(/Vorhandene Plätze/)
  if (await spotsHeader.count() > 0) {
    console.log('✓ Step 7: Found "Vorhandene Plätze" header')
    await expect(page.getByText('Zimmer Nord')).toBeVisible({ timeout: 2000 })
    await expect(page.getByText(/\d+ Betten/)).toBeVisible({ timeout: 2000 })
  } else {
    console.log('✗ Step 7: Could not find "Vorhandene Plätze" header')
    throw new Error('Page did not update after form submission')
  }

  // Verify individual beds
  await expect(page.getByText('Bett 1')).toBeVisible()
  await expect(page.getByText('Bett 2')).toBeVisible()
  await expect(page.getByText('Bett 3')).toBeVisible()

  console.log('✓ Step 7: Room and beds are displayed correctly')

  // Step 8: Verify "Fertig" button appears
  await expect(page.getByRole('link', { name: /Fertig/ })).toBeVisible()

  console.log('✓ Step 8: "Fertig" button is visible')

  // Step 9: Click "Fertig" and verify navigation to housing unit page
  await page.click('a:has-text("Fertig")')
  await page.waitForURL(/\/housing\/[^\/]+$/)

  console.log('✓ Step 9: Navigated to housing unit page')

  // Step 10: Verify housing unit page shows correct data
  await expect(page.getByText(buildingCode)).toBeVisible()
  await expect(page.getByText('Teststrasse 123, 8000 Zürich')).toBeVisible()
  await expect(page.getByText('Zimmer Nord')).toBeVisible()

  console.log('✓ Step 10: Housing unit page displays correct data')

  console.log('\n🎉 Complete workflow test PASSED!')
})
