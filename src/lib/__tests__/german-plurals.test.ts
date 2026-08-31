import { readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import { HOUSING_LIST_LABELS } from '@/lib/constants/labels/ui'
import { CLIENT_BOARD_LABELS } from '@/lib/constants/labels/residents'

/**
 * German plurals are not suffixes, and a count label that ignores that is
 * wrong on screen while being perfectly green in every other check.
 *
 * Two shipped to production and were found by LOOKING at the pages, not by any
 * test:
 *
 *   "1 Konflikte"      — housing list. No singular at all: `{n} Konflikte`
 *                        hardcoded in JSX. Wrong at exactly the value the
 *                        badge exists to make noticeable.
 *   "3 Vorfallfälle"   — client board. A plural built by APPENDING to the
 *                        singular: `Vorfall` + (n !== 1 ? 'fälle' : ''). Reads
 *                        correctly at n = 1, which is the value a developer
 *                        checks, and is nonsense at every other number.
 *
 * The second is the one worth a gate. German pluralisation frequently changes
 * the STEM — Vorfall → Vorfälle, Haus → Häuser, Vorschlag → Vorschläge — so a
 * suffix bolted onto the singular cannot produce the right word in the general
 * case. It is not a typo to be corrected once; it is an idiom that is always
 * wrong and looks reasonable in a diff.
 *
 * SCOPE, stated rather than left implicit: this bans the concatenation idiom
 * and pins the two labels that were fixed. It does NOT yet require every
 * count-bearing German string to come from a label function — that rule is
 * right, it is already written in CLAUDE.md, and enforcing it mechanically
 * would flag around eight existing sites that need reading one at a time.
 * Deferring it is a decision, not an oversight, and it stays visible here.
 */

const SRC = join(process.cwd(), 'src')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full)
    return entry.name.endsWith('.tsx') ? [full] : []
  })
}

const TSX_FILES = walk(SRC)

/**
 * A word immediately followed by an interpolation that picks between a bare
 * suffix and nothing — `Vorfall{n !== 1 ? 'fälle' : ''}`.
 *
 * Anchored on the QUOTED suffix rather than on any noun list, so it catches the
 * shape for words nobody has thought of yet. The suffix must be letters only:
 * `{cond ? ' (30T)' : ''}` and `{cond ? 'x' : 'y'}` are different things and
 * neither is this bug.
 */
const APPENDED_PLURAL = /[A-Za-zÄÖÜäöüß]\{[^}]*\?\s*'[A-Za-zÄÖÜäöüß]+'\s*:\s*''\s*\}/

describe('German plurals are never built by concatenation', () => {
  it('scans a believable number of components', () => {
    // Guards the walker: an empty list would make the assertion below pass
    // while checking nothing, which is the failure mode of every file-walking
    // test that has ever gone quietly inert.
    expect(TSX_FILES.length).toBeGreaterThan(100)
  })

  it('no component appends a plural suffix to a German word', () => {
    const offenders = TSX_FILES.filter((file) =>
      APPENDED_PLURAL.test(readFileSync(file, 'utf8')),
    ).map((file) => relative(SRC, file))

    expect(offenders).toEqual([])
  })

  it('the pattern actually matches the bug it was written for', () => {
    // Proven by mutation rather than trusted: a regex that matches nothing is
    // indistinguishable from a clean codebase, and this file would then be a
    // gate that can never fail.
    const asItShipped = "{client.incidentCount} Vorfall{client.incidentCount !== 1 ? 'fälle' : ''}"
    expect(APPENDED_PLURAL.test(asItShipped)).toBe(true)
  })

  it('does not flag a conditional that is not a plural suffix', () => {
    // The narrowing that keeps this gate usable. Both of these are legitimate.
    expect(APPENDED_PLURAL.test("{count} Tage{isMore ? ' (mehr)' : ''}")).toBe(false)
    expect(APPENDED_PLURAL.test("{n} Regel{n === 1 ? 'n' : 'n'}")).toBe(false)
  })
})

describe('the two labels that were wrong on production', () => {
  it('says "1 Konflikt", not "1 Konflikte"', () => {
    expect(HOUSING_LIST_LABELS.conflictCount(1)).toBe('1 Konflikt')
    expect(HOUSING_LIST_LABELS.conflictCount(3)).toBe('3 Konflikte')
  })

  it('says "3 Vorfälle", not "3 Vorfallfälle"', () => {
    expect(CLIENT_BOARD_LABELS.incidentCount(1)).toBe('1 Vorfall (30T)')
    expect(CLIENT_BOARD_LABELS.incidentCount(3)).toBe('3 Vorfälle (30T)')
  })

  it('keeps the umlaut the stem change requires', () => {
    // The specific thing concatenation could never have produced.
    expect(CLIENT_BOARD_LABELS.incidentCount(2)).toContain('Vorfälle')
    expect(CLIENT_BOARD_LABELS.incidentCount(2)).not.toContain('Vorfallfälle')
  })

  it('uses Swiss German — no ß', () => {
    expect(HOUSING_LIST_LABELS.conflictCount(2)).not.toContain('ß')
    expect(CLIENT_BOARD_LABELS.incidentCount(2)).not.toContain('ß')
  })
})
