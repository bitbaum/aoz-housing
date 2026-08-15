/**
 * Gate: a resident is displayed by NAME, never by raw login code.
 *
 * `residentName()` / `residentInitials()` are the SSOT (lib/utils/resident-name.ts)
 * and degrade to the code on their own when someone chose no display name. A
 * component that renders `resident.code` directly type-checks, lints and
 * renders — as a bare code — which is how the chore board came to say
 * "erledigt von RES-LCCM7A" to the person's own flatmates, and how the staff
 * queues showed codes for people whose names were sitting in the same row.
 *
 * Selecting only `{ code: true }` in Prisma causes the same defect one layer
 * earlier, so use RESIDENT_NAME_SELECT in queries whose rows reach the UI.
 *
 * Showing the code IS right in a few places (it is the login identity, and
 * staff read it out to residents). Those opt out explicitly with the marker
 * below — the point is that it becomes a decision, not an accident.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sync as globSync } from 'glob'

const SRC = join(process.cwd(), 'src')
const OPT_OUT = 'resident-code-intentional'

/** Accessors that hold a resident row somewhere in the product. */
const RESIDENT_ACCESSORS = [
  'resident',
  'reportedBy',
  'subject',
  'completedBy',
  'flaggedBy',
  'requestedBy',
  'requestedResident',
  'createdByResident',
  'involvedResident',
  'roommate',
]

// `X.code` inside a JSX expression. Only the accessor DIRECTLY before `.code`
// decides: `resident.placements[0].housingUnit.code` is a unit code that
// happens to be reached through a resident, and is none of this rule's business.
const CODE_ACCESS = /\{[^{}]*?([A-Za-z0-9_]+)\??\.code\b/g

/**
 * Carrying the code as DATA is fine — `{ code: resident.code }` feeds the very
 * helpers this rule exists to enforce, and `residentCode={…}` hands the login
 * code to a component that asks for exactly that. Only rendering it is a bug.
 */
const PASSES_CODE_AS_DATA = /\bcode:\s*[A-Za-z0-9_.?[\]]*\.code\b/
const PASSES_CODE_AS_PROP = /[Cc]ode=\{/

function rendersResidentCode(line: string): boolean {
  if (PASSES_CODE_AS_DATA.test(line) || PASSES_CODE_AS_PROP.test(line)) return false
  return Array.from(line.match(CODE_ACCESS) ?? []).some((fragment) => {
    const accessor = /([A-Za-z0-9_]+)\??\.code\b/.exec(fragment)?.[1]
    return !!accessor && RESIDENT_ACCESSORS.includes(accessor)
  })
}

function componentFiles(): string[] {
  return globSync('**/*.tsx', { cwd: SRC, absolute: true }).filter(
    (f) => !f.includes('__tests__')
  )
}

describe('resident display-name SSOT', () => {
  it('renders residents by name, never by raw login code', () => {
    const violations: string[] = []

    for (const file of componentFiles()) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (!rendersResidentCode(line)) return
        // An opt-out on this line or the line above documents the exception.
        const context = `${lines[i - 1] ?? ''}\n${line}`
        if (context.includes(OPT_OUT)) return
        violations.push(`${file.replace(SRC, 'src')}:${i + 1}  ${line.trim()}`)
      })
    }

    expect(violations).toEqual([])
  })

  // A rule that has quietly stopped matching looks exactly like a clean
  // codebase, so prove the detector still fires and still holds its fire.
  it('detects a regression, and does not cry wolf', () => {
    expect(rendersResidentCode('<p>{resident.code}</p>')).toBe(true)
    expect(rendersResidentCode('<span>{p.resident.code.slice(-3)}</span>')).toBe(true)
    expect(rendersResidentCode('Betrifft: {incident.subject.code}')).toBe(true)

    expect(rendersResidentCode('<p>{residentName(resident)}</p>')).toBe(false)
    // A UNIT code reached through a resident is not a resident name.
    expect(rendersResidentCode('{resident.placements[0]?.housingUnit?.code}')).toBe(false)
    expect(rendersResidentCode('{ id: p.resident.id, code: p.resident.code }')).toBe(false)
    expect(rendersResidentCode('<Danger residentCode={resident.code} />')).toBe(false)
  })

  it('keeps the opt-out marker meaningful — it must be used sparingly', () => {
    const marked = componentFiles().filter((f) =>
      readFileSync(f, 'utf8').includes(OPT_OUT)
    )
    // If this trips, the exception has become the rule: check whether those
    // screens really mean to show a login code.
    expect(marked.length).toBeLessThanOrEqual(6)
  })
})
