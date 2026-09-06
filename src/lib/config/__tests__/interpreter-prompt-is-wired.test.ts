import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { INTERPRETER_LEAD_TIME_HOURS, interpreterPrompt } from '@/lib/config/interpreting'

/**
 * The interpreter warning has to be about THIS appointment.
 *
 * `interpreterPrompt` returns `'too-late'` when a meeting is booked inside the
 * lead time, and its own docstring says it exists so "the staff form, the care
 * workspace and any future surface cannot disagree about when the warning
 * appears". **Neither surface called it.** `CareWorkspace` rendered one static
 * banner — always `leadTimeOk`, the reassuring wording — above the field where
 * the time is chosen, so booking for tomorrow morning read exactly like
 * booking for next month.
 *
 * The failure that module exists to prevent is concrete and expensive: a
 * consequential meeting booked inside the lead time, discovered at the door,
 * with a person who cannot follow it. Its own label says the warning is "said
 * where a time is picked, not buried in a profile".
 */

const ROOT = join(__dirname, '..', '..', '..', '..')
const WORKSPACE = 'src/components/residents/CareWorkspace.tsx'

const hoursFromNow = (hours: number, now: Date) => new Date(now.getTime() + hours * 60 * 60 * 1000)

describe('the prompt itself', () => {
  const now = new Date('2026-09-06T09:00:00Z')

  it('warns when the meeting is inside the lead time', () => {
    const soon = hoursFromNow(INTERPRETER_LEAD_TIME_HOURS - 1, now)
    expect(interpreterPrompt('ALWAYS', soon, now)).toBe('too-late')
    expect(interpreterPrompt('FOR_COMPLEX', soon, now)).toBe('too-late')
  })

  it('only reminds when there is still time', () => {
    const later = hoursFromNow(INTERPRETER_LEAD_TIME_HOURS + 1, now)
    expect(interpreterPrompt('ALWAYS', later, now)).toBe('reminder')
  })

  it('says nothing for a person who needs no interpreting', () => {
    expect(interpreterPrompt('NONE', hoursFromNow(1, now), now)).toBe('none')
  })

  it('does not flag a meeting that already happened', () => {
    // Marking history as urgent trains people to ignore the flag.
    expect(interpreterPrompt('ALWAYS', hoursFromNow(-2, now), now)).toBe('none')
  })
})

describe('the surface that picks a time actually asks it', () => {
  /**
   * A source check, because the alternative is a component test that renders
   * the whole workspace. What matters is narrow and stable: the file that owns
   * the `datetime-local` field must consult `interpreterPrompt`, rather than
   * printing one banner regardless of the time.
   */
  it('CareWorkspace consults interpreterPrompt, not just needsInterpreter', () => {
    const source = readFileSync(join(ROOT, WORKSPACE), 'utf8')
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n')

    expect(source).toMatch(/interpreterPrompt\(/)
    // And the late case has to be renderable, or calling it changes nothing.
    expect(source).toMatch(/too-late/)
    expect(source).toMatch(/leadTimeWarning/)
  })
})
