import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { calculateApartmentFit, calculateApartmentProfile } from '@/lib/compatibility/aggregate'

import { makeResident } from './fixtures'

/**
 * The compatibility engine computes things nobody reads.
 *
 * This is the most-repeated defect in this codebase, and it is worst here: the
 * engine's outputs are the product's reasons for putting a person in a house.
 * CLAUDE.md states as settled fact that staff are told the DIRECTION of
 * cleanliness friction plus `hasDoubleStandard` and `isHighMaintenance` — and
 * the last of those was computed by a tested function that nothing outside its
 * own test file ever called. A demanding, low-tolerance client was scored,
 * flagged, and then never mentioned to the person placing them.
 *
 * A dead export in a UI helper wastes a few lines. A dead export here is a
 * finding the product had and withheld.
 */

const ENGINE_DIR = join(__dirname, '..')
const SEARCH_ROOTS = [join(__dirname, '..', '..', '..')]

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    // Tests are excluded as CALLERS, which is also what stops this gate from
    // indexing itself: a repo-scanning check that counts its own mentions
    // reports every symbol as live.
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      found.push(...sourceFiles(path))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      found.push(path)
    }
  }
  return found
}

const ENGINE_FILES = readdirSync(ENGINE_DIR)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => join(ENGINE_DIR, name))

const ALL_SOURCES = SEARCH_ROOTS.flatMap(sourceFiles).map((path) => ({
  path,
  text: readFileSync(path, 'utf8'),
}))

/** Exported functions, which are the ones that compute something. */
function exportedFunctions(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/^export (?:async )?function (\w+)/gm)].map((match) => match[1])
}

describe('every function the engine exports is read by something', () => {
  const cases = ENGINE_FILES.flatMap((file) =>
    exportedFunctions(file).map((name) => ({ file, name })),
  )

  it('finds functions to check, so an empty scan cannot pass silently', () => {
    expect(cases.length).toBeGreaterThan(5)
  })

  it.each(cases)('$name is called outside its own declaration', ({ name }) => {
    const declaration = new RegExp(`^export (?:async )?function ${name}\\b`, 'm')
    const called = new RegExp(`\\b${name}\\s*\\(`)

    const callers = ALL_SOURCES.filter(({ text }) => {
      const withoutDeclaration = text.replace(declaration, '')
      return called.test(withoutDeclaration)
    })

    expect(callers.length).toBeGreaterThan(0)
  })
})

describe('a demanding, low-tolerance client is named to the person placing them', () => {
  // Built through the real profile builder rather than by hand: a fixture
  // written alongside the assertion agrees with it by construction, and this
  // engine has already shipped one bug that only hand-made rows could hide.
  const household = calculateApartmentProfile([
    makeResident({ cleanlinessPractice: 3, cleanlinessExpectation: 3, chaosTolerance: 3 }),
  ])

  it('warns about high expectation paired with low tolerance', () => {
    // Tidy themselves, so this is NOT the double-standard case — the two flags
    // answer different questions and only one of them was ever surfaced.
    const demanding = makeResident({
      cleanlinessPractice: 5,
      cleanlinessExpectation: 5,
      chaosTolerance: 1,
    })
    const result = calculateApartmentFit(demanding, household)
    expect(result.warnings.join(' ')).toMatch(/Toleranz/)
  })

  it('stays quiet for someone easy to place', () => {
    const easy = makeResident({
      cleanlinessPractice: 3,
      cleanlinessExpectation: 3,
      chaosTolerance: 4,
    })
    const result = calculateApartmentFit(easy, household)
    expect(result.warnings.join(' ')).not.toMatch(/Toleranz/)
  })
})

describe('what counts as a blocking concern is decided in one place', () => {
  it('the match card does not re-derive it from German prose', () => {
    // The card matched substrings of PLACEMENT_CONCERN_LABELS. Rewording a
    // label there — the one file where such a reword happens — would have
    // stopped painting blocked units red while the ranking still buried them
    // by 1000 points: the sort and the colour describing different units, with
    // nothing failing.
    const card = readFileSync(
      join(__dirname, '..', '..', '..', 'components', 'matching', 'MatchCard.tsx'),
      'utf8',
    )
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n')

    expect(card).not.toMatch(/includes\(['"]Rollstuhl/)
    expect(card).not.toMatch(/includes\(['"]Erdgeschoss/)
    expect(card).toMatch(/isBlockingConcern\(/)
  })
})
