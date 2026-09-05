import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

/**
 * `pnpm run verify` and CI must run the SAME set of checks.
 *
 * The fleet convention is that CI calls `pnpm run verify` verbatim, so the two
 * cannot drift. This repo deliberately does not: it splits the checks across
 * parallel jobs (lint-and-typecheck / unit-tests / build / e2e) because that
 * takes the longest job off the critical path. That split is the whole reason
 * this test exists — a split bundle is a bundle that can lose a member.
 *
 * It did. `format:check` was added to `verify` and never to `ci.yml`, so master
 * failed `pnpm run verify` from #181 to #189 on two drizzle-kit snapshots while
 * every CI run was green. Nobody was lying to anybody; the two lists were just
 * maintained by hand in two files.
 *
 * A local red that CI calls green is worse than no check at all: it reads as a
 * problem with your laptop, so you route around it instead of fixing it.
 */

const ROOT = join(__dirname, '..', '..', '..')

function scriptsNamedByVerify(): string[] {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>
  }
  const verify = pkg.scripts.verify
  expect(verify, 'package.json must define a `verify` script').toBeTruthy()

  // `pnpm run a && pnpm run b && ...`
  return [...verify.matchAll(/pnpm\s+run\s+([\w:-]+)/g)].map((m) => m[1])
}

function scriptsRunByCi(): Set<string> {
  const ci = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8')
    // Strip YAML comments first, or the gate can be satisfied by its own
    // documentation: the header above these jobs names `format:check` while
    // explaining why it must be a step. A prose mention is not a step. Cutting
    // at `#` can only ever drop a real command and turn the gate RED, which is
    // the safe direction to be wrong in.
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n')

  // Both `pnpm run test` and the shorthand `pnpm test -- --coverage` count.
  return new Set([...ci.matchAll(/pnpm\s+(?:run\s+)?([\w:-]+)/g)].map((m) => m[1]))
}

describe('verify and CI run the same bundle', () => {
  it('names more than one check, so the comparison is worth making', () => {
    expect(scriptsNamedByVerify().length).toBeGreaterThan(1)
  })

  it('runs every check from `verify` somewhere in CI', () => {
    const ci = scriptsRunByCi()
    const missing = scriptsNamedByVerify().filter((script) => !ci.has(script))

    expect(
      missing,
      `These checks are in \`pnpm run verify\` but no CI job runs them, so a green ` +
        `CI would not mean a green verify: ${missing.join(', ')}. Add a step to ` +
        `.github/workflows/ci.yml — or drop them from verify. The two lists are one decision.`,
    ).toEqual([])
  })
})
