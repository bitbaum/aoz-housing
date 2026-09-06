import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

/**
 * The score has to come with its reasoning.
 *
 * `buildPlacementRationale` composes the argument for a placement — "Apartment
 * Fit: N%", then Stärken, Bedenken, and the sub-scores — and every placement
 * saves it to `placementNotes`. It is written in three separate paths
 * (`actions/matching.ts`, `actions/placements.ts`, and the transfer reason),
 * it is in the Zod schema so it was meant to be editable, and **no component
 * ever read the column.**
 *
 * So the client page showed "85% — Sehr gut" and nothing about why. That is
 * precisely the black box this product's first principles forbid:
 *
 *   "Transparency — decisions must be explainable. No black-box algorithms."
 *
 * The failure is quiet in the way this codebase keeps producing: the number
 * looks like an answer, so nobody notices the argument is missing.
 */

const ROOT = join(__dirname, '..', '..', '..')

/**
 * Source with ALL comments removed — line, block, and JSX.
 *
 * The first version of this file stripped only `//` lines, and its own
 * `{/* ... *\/}` comment mentioning `placementNotes` satisfied the check: I
 * deleted the render block and the test stayed green. A gate its own
 * documentation can pass is not a gate, and this is the third variant of that
 * mistake in one session — the subject of a check must never be part of what
 * the check reads.
 */
function sourceOf(relative: string): string {
  return readFileSync(join(ROOT, relative), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

describe('a placement shows why it was made', () => {
  it('renders placementNotes on the client page', () => {
    const page = sourceOf('src/app/(admin)/residents/[id]/page.tsx')
    // The ACCESS, not the word — a mention in prose is not a render.
    expect(page).toMatch(/currentPlacement\.placementNotes/)
  })

  it('still writes it, so there is something to render', () => {
    // If a refactor stopped composing the rationale, the test above would keep
    // passing against an always-empty column and assert nothing.
    const matching = sourceOf('src/lib/actions/matching.ts')
    expect(matching).toMatch(/buildPlacementRationale\(/)
    expect(matching).toMatch(/placementNotes/)
  })

  it('keeps the reasoning next to the score, not on another page', () => {
    // The point is that somebody reading "85% — Sehr gut" can see the argument
    // without navigating. Both must live in the same file.
    const page = sourceOf('src/app/(admin)/residents/[id]/page.tsx')
    expect(page).toMatch(/compatibilityScore/)
    expect(page).toMatch(/placementRationale/)
  })
})
