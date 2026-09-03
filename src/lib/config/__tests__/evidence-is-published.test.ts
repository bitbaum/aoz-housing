/**
 * Evidence that nothing renders is decoration.
 *
 * `job-integration-docs.ts` shipped with a docstring promising the opposite —
 * "a page of citations nobody reads is decoration" — and then
 * `JOB_RESEARCH_SOURCES` and `INTEGRATION_PRINCIPLES` were imported by exactly
 * two things: the queue that consumes the one-line action copy, and their own
 * test. No component rendered either. Meanwhile the housing side had five tabs
 * of methodology and a sources table.
 *
 * So a Jobcoach acted on "Vermittlung wirkt vor Qualifizierung" with nowhere to
 * read why. This test asserts the surface exists, because the SSOT existing is
 * evidently not enough to make it visible.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { INTEGRATION_PRINCIPLES, JOB_RESEARCH_SOURCES } from '../job-integration-docs'
import { RESEARCH_SOURCES } from '../algorithm-docs'

const COMPONENTS = join(process.cwd(), 'src/components')

/** Every component file, read once. */
function allComponentSources(): string {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '__tests__') continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith('.tsx')) out.push(readFileSync(path, 'utf8'))
    }
  }
  walk(COMPONENTS)
  return out.join('\n')
}

describe('every evidence set has something that renders it', () => {
  const components = allComponentSources()

  it.each([['JOB_RESEARCH_SOURCES'], ['INTEGRATION_PRINCIPLES'], ['RESEARCH_SOURCES']])(
    '%s is referenced by a component',
    (symbol) => {
      expect(components).toContain(symbol)
    },
  )

  it('both domains actually have sources to show', () => {
    // A rendered-but-empty table would satisfy the check above while telling a
    // caseworker nothing.
    expect(JOB_RESEARCH_SOURCES.length).toBeGreaterThan(0)
    expect(RESEARCH_SOURCES.length).toBeGreaterThan(0)
  })

  it('every principle names a source that exists', () => {
    const known = new Set(JOB_RESEARCH_SOURCES.map((s) => s.id))
    for (const principle of INTEGRATION_PRINCIPLES) {
      for (const id of principle.sourceIds) {
        expect({ principle: principle.id, id, known: known.has(id) }).toEqual({
          principle: principle.id,
          id,
          known: true,
        })
      }
    }
  })

  it('the page distinguishes what the software acts on from what it does not', () => {
    // Rendering `status` is the honesty that makes the page worth having: an
    // evidence page implying more than the product does is worse than none.
    const both = new Set(INTEGRATION_PRINCIPLES.map((p) => p.status))
    expect(both.has('signal')).toBe(true)
    expect(both.has('documented')).toBe(true)
  })
})
