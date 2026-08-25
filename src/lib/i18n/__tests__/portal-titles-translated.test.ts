import { execSync } from 'child_process'
import { readFileSync } from 'fs'

/**
 * A portal page's TAB must be in the reader's language too.
 *
 * `export const metadata = { title: 'Aufgaben' }` is evaluated once, at build
 * time, so it cannot know who is reading. Every portal page did this, and the
 * result was a tab reading "Заявка на переезд | Mein Bereich" — the page in
 * Russian, the portal's own name in German, in the strip of text a person uses
 * to tell two open tabs apart.
 *
 * It is the same defect as a hardcoded label, one layer up, and it hides
 * better: nobody screenshots a tab.
 *
 * `generateMetadata` runs per request and can reach the translator, so the
 * rule is simply that portal pages use it.
 */

function portalPagesWithStaticTitle(): string[] {
  const out = execSync(
    `grep -rlE "^export const metadata" --include=page.tsx --include=layout.tsx src/app/portal || true`,
    { encoding: 'utf8', cwd: process.cwd() }
  )
  return out
    .split('\n')
    .filter(Boolean)
    .filter((file) => /title\s*:/.test(readFileSync(file, 'utf8')))
    .sort()
}

describe('portal tabs are translated', () => {
  it('finds portal pages to check', () => {
    // Vacuity guard: the rule is only meaningful if pages exist to break it.
    const pages = execSync(`ls src/app/portal/*/page.tsx | wc -l`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    expect(Number(pages.trim())).toBeGreaterThan(8)
  })

  it('no portal page declares a build-time title', () => {
    expect({ staticTitles: portalPagesWithStaticTitle() }).toEqual({ staticTitles: [] })
  })

  it('the pages that have a title resolve it through the translator', () => {
    const withTitle = execSync(
      `grep -rl "generateMetadata" --include=page.tsx --include=layout.tsx src/app/portal || true`,
      { encoding: 'utf8', cwd: process.cwd() }
    )
      .split('\n')
      .filter(Boolean)

    // Every one of them must actually call the translator — a
    // `generateMetadata` returning a German literal would pass the check above
    // while changing nothing for the reader.
    const notTranslated = withTitle.filter(
      (file) => !readFileSync(file, 'utf8').includes('getRequestTranslator')
    )

    expect(withTitle.length).toBeGreaterThan(8)
    expect({ notTranslated }).toEqual({ notTranslated: [] })
  })
})
