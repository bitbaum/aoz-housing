import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { unitName, unitLabel, hasResidentName, UNIT_NAME_SELECT } from '@/lib/utils/unit-name'

/**
 * Residents may name their own apartment. Staff saw only the code, so the two
 * groups who talk about the same flat every day had no shared word for it.
 */

describe('what to call a housing unit', () => {
  it('uses the name the residents chose', () => {
    expect(unitName({ code: 'DEMO-U05', nickname: 'Casa Harmonie' })).toBe('Casa Harmonie')
  })

  it('falls back to the code when they have not chosen one', () => {
    expect(unitName({ code: 'DEMO-U05', nickname: null })).toBe('DEMO-U05')
  })

  it('treats whitespace as no name', () => {
    // An input that was cleared by typing spaces must not render a blank
    // heading where the unit's identity should be.
    expect(unitName({ code: 'DEMO-U05', nickname: '   ' })).toBe('DEMO-U05')
    expect(hasResidentName({ code: 'DEMO-U05', nickname: '   ' })).toBe(false)
  })

  it('shows staff both names, because they need the code too', () => {
    // The code is what records, exports and calls to the office are keyed on.
    // Leading with it is what made the residents' name invisible.
    expect(unitLabel({ code: 'DEMO-U05', nickname: 'Casa Harmonie' })).toBe(
      'Casa Harmonie (DEMO-U05)',
    )
  })

  it('never renders empty brackets for an unnamed unit', () => {
    expect(unitLabel({ code: 'DEMO-U05', nickname: null })).toBe('DEMO-U05')
  })

  it('asks for both columns in the select fragment', () => {
    // Selecting only `code` type-checks and renders — as a bare code, silently.
    expect(UNIT_NAME_SELECT).toEqual({ code: true, nickname: true })
  })
})

describe('staff surfaces do not render a bare unit code', () => {
  /**
   * The same denylist idea as `resident-name-ssot.test.ts`: rendering
   * `{unit.code}` type-checks, lints and looks completely fine. It just tells a
   * caseworker "DEMO-U05" for a flat everyone living in it calls Casa Harmonie.
   *
   * Scoped to the two staff housing surfaces this change fixed, so it states a
   * fact that is true rather than a rule the rest of the app has not adopted
   * yet — a gate that has to be argued with gets deleted.
   */
  const GUARDED = [join('src', 'components', 'housing', 'HousingList.tsx')]

  it.each(GUARDED)('%s uses the helpers', (relative) => {
    const source = readFileSync(join(process.cwd(), relative), 'utf8')

    const bare = source
      .split('\n')
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => /\{unit\.code\}/.test(line))
      .map(({ line, number }) => `${relative}:${number} ${line}`)

    expect(bare).toEqual([])
  })

  it('guards files that actually exist', () => {
    // A path typo would make every assertion above pass by reading nothing.
    for (const relative of GUARDED) {
      expect(statSync(join(process.cwd(), relative)).isFile()).toBe(true)
    }
  })

  it('has a helper module for the whole app to use', () => {
    // Cheap check that the SSOT is where the comments say it is, so the rule
    // above points somewhere real.
    const utils = readdirSync(join(process.cwd(), 'src', 'lib', 'utils'))
    expect(utils).toContain('unit-name.ts')
  })
})
