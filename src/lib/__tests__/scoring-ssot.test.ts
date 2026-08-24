/**
 * The compatibility algorithm has exactly ONE implementation.
 *
 * `prisma/scoring-helper.ts` used to hold a second one, so the seed wrote
 * `Placement.compatibilityScore` values the product would never compute — a
 * whole database of plausible, wrong numbers that every demo, screenshot and
 * accuracy panel then reported as fact. Nothing caught it: it type-checked,
 * it linted, it produced sensible-looking percentages, and the only symptom
 * was that the software described on the algorithm page was not the software
 * that had scored the data.
 *
 * The escape hatch that justified it — "ts-node cannot resolve @/ aliases" —
 * is closed at the runner (`ts-node -r tsconfig-paths/register`), so there is
 * no longer any reason to copy scoring logic anywhere.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const REPO_ROOT = join(__dirname, '..', '..', '..')
const PRISMA_DIR = join(REPO_ROOT, 'prisma')

/** Weight tables, dimension math — the shapes a re-implementation takes. */
const SCORING_IMPLEMENTATION_MARKERS = [
  /const\s+WEIGHTS\s*=/,
  /function\s+calculate(Lifestyle|Social|Practical|Risk)Compatibility/,
  /lifestyle\s*:\s*\d+\s*,\s*\n?\s*social\s*:\s*\d+/,
]

function prismaTsFiles(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) return entry.name === 'migrations' ? [] : walk(full)
      return entry.name.endsWith('.ts') ? [full] : []
    })
  return walk(PRISMA_DIR)
}

describe('compatibility scoring SSOT', () => {
  it('no seed file re-implements the scoring math', () => {
    const offenders: string[] = []

    for (const file of prismaTsFiles()) {
      const source = readFileSync(file, 'utf8')
      for (const marker of SCORING_IMPLEMENTATION_MARKERS) {
        if (marker.test(source)) {
          offenders.push(`${file.replace(REPO_ROOT, '.')} matches ${marker}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('the seed adapter delegates to the product algorithm', () => {
    const source = readFileSync(join(PRISMA_DIR, 'scoring-helper.ts'), 'utf8')
    expect(source).toContain('calculateCompatibility')
    expect(source).toContain('@/lib/compatibility')
  })

  it('the seed runner resolves path aliases, or the copy comes back', () => {
    // Without this flag the seed cannot import the real algorithm at all, and
    // the next person hits exactly the wall that produced the duplicate.
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'))
    expect(pkg.prisma.seed).toContain('tsconfig-paths/register')
  })
})
