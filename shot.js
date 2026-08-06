const { chromium } = require('@playwright/test')
;(async () => {
  const url = process.argv[2], out = process.argv[3]
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  const primary = await p.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-brand-primary').trim())
  const brand = await p.evaluate(() => document.documentElement.getAttribute('data-brand'))
  await p.screenshot({ path: out, fullPage: false })
  console.log(`brand=${brand} --color-brand-primary=${primary}`)
  await b.close()
})()
