import { execSync } from 'child_process'
import { readFileSync } from 'fs'

/**
 * A page title must not repeat the product name.
 *
 * The root layout sets `template: '%s | <product>'`, so every page title
 * already ends with the brand. A page that also NAMES the brand in its own
 * title renders it twice — "AOZ Begleitung — Integrationsplattform | AOZ
 * Begleitung" was the landing page's tab, which is the single place a
 * first-time visitor reads the product's name.
 *
 * Next has an answer for this — `title: { absolute: '…' }` opts out of the
 * template — so the rule is: if a page's title interpolates the product name,
 * it must be absolute.
 *
 * Checked in the source rather than by rendering, because page metadata is
 * static and this is the cheapest place to make the rule enforceable.
 */

/** Pages whose exported metadata title mentions the brand. */
function pagesNamingTheBrandInTitle(): string[] {
  const out = execSync(
    `grep -rlE "title: .*(BRAND\\.productName|APP_LABELS\\.name)" --include=page.tsx --include=layout.tsx src/app || true`,
    { encoding: 'utf8', cwd: process.cwd() },
  )
  return out.split('\n').filter(Boolean).sort()
}

/** The root layout OWNS the template, so it is the one file allowed to set it. */
const TEMPLATE_OWNER = 'src/app/layout.tsx'

describe('page titles do not print the product name twice', () => {
  const pages = pagesNamingTheBrandInTitle().filter((file) => file !== TEMPLATE_OWNER)

  it('confirms the template that makes duplication possible still exists', () => {
    // Vacuity guard. Without the appending template there is nothing to
    // duplicate, and this whole suite would be checking a rule that no longer
    // applies while still reporting green.
    const root = readFileSync(TEMPLATE_OWNER, 'utf8')

    expect(root).toMatch(/template:\s*`%s \| \$\{APP_LABELS\.name\}`/)
  })

  it.each(pages.length ? pages : ['(no page titles name the brand)'])(
    '%s opts out of the title template',
    (file) => {
      if (file.startsWith('(')) return

      const source = readFileSync(file, 'utf8')
      const titleBlock = /title:\s*\{[^}]*absolute\s*:/.test(source)

      expect({ file, usesAbsolute: titleBlock }).toEqual({ file, usesAbsolute: true })
    },
  )
})
