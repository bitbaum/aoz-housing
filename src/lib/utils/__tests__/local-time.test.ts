import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import {
  dayPartAt,
  formatWeekdayDate,
  APP_TIME_ZONE,
  fromDatetimeLocalInput,
  toDatetimeLocalInput,
} from '@/lib/utils/local-time'

/**
 * The bug: a `'use client'` component is ALSO rendered on the server, so
 * `new Date()` inside one is UTC in the container and Europe/Zurich in the
 * browser. For two hours every day the two renders disagreed about the
 * greeting, React discarded the server tree and rebuilt the dashboard on the
 * client (React errors 425 / 422), and nothing visible broke — it just silently
 * stopped being server-rendered.
 */

describe('the day part is the reader’s, not the container’s', () => {
  it('reads 08:00 UTC in winter as morning in Zurich', () => {
    // Zurich is UTC+1 in January: 09:00 local.
    expect(dayPartAt(new Date('2026-01-15T08:00:00Z'))).toBe('morning')
  })

  it('reads 11:30 UTC in summer as afternoon in Zurich', () => {
    // The exact case seen in production: UTC says 11 ("Guten Morgen"), Zurich
    // says 13 ("Guten Tag"). Same instant, two different greetings.
    expect(dayPartAt(new Date('2026-08-16T11:30:00Z'))).toBe('day')
  })

  it('handles the daylight-saving offset, not a fixed +1', () => {
    // 16:30 UTC is 18:30 in Zurich in August (UTC+2) but 17:30 in January.
    expect(dayPartAt(new Date('2026-08-16T16:30:00Z'))).toBe('evening')
    expect(dayPartAt(new Date('2026-01-16T16:30:00Z'))).toBe('day')
  })

  it('gives the same answer whatever zone the caller is in', () => {
    // This is the property that actually fixes the hydration mismatch: the
    // result depends on the instant and Zurich, never on the local clock.
    const instant = new Date('2026-08-16T11:30:00Z')

    expect(dayPartAt(instant, APP_TIME_ZONE)).toBe(dayPartAt(instant, 'Europe/Zurich'))
    expect(dayPartAt(instant, 'UTC')).toBe('morning')
    expect(dayPartAt(instant, 'Europe/Zurich')).toBe('day')
  })

  it('formats the date in Zurich rather than UTC', () => {
    // 23:30 UTC on the 16th is already the 17th in Zurich. A staff member
    // reading "16. August" late in the evening is being told the wrong day.
    expect(formatWeekdayDate(new Date('2026-08-16T23:30:00Z'))).toContain('17')
  })
})

describe('datetime-local values are Zurich wall-clock, not the server zone', () => {
  it('round-trips a summer afternoon', () => {
    const wall = '2026-08-17T14:30'
    const instant = fromDatetimeLocalInput(wall)
    expect(instant).not.toBeNull()
    expect(toDatetimeLocalInput(instant!)).toBe(wall)
  })

  it('round-trips a winter morning', () => {
    const wall = '2026-01-15T09:15'
    const instant = fromDatetimeLocalInput(wall)
    expect(instant).not.toBeNull()
    expect(toDatetimeLocalInput(instant!)).toBe(wall)
  })
})

describe('no dashboard component reads a clock during render', () => {
  /**
   * The structural half of the fix. Re-adding `new Date()` to any of these
   * components silently reintroduces the mismatch: it type-checks, it lints,
   * it renders correctly in every screenshot, and it only shows up as console
   * errors on a machine whose timezone differs from the server's.
   */
  const DASHBOARD_DIR = join(process.cwd(), 'src', 'components', 'dashboard')

  it('finds the components', () => {
    expect(readdirSync(DASHBOARD_DIR).filter((f) => f.endsWith('.tsx')).length).toBeGreaterThan(5)
  })

  it.each(
    readdirSync(DASHBOARD_DIR).filter(
      (name) => name.endsWith('.tsx') && statSync(join(DASHBOARD_DIR, name)).isFile(),
    ),
  )('%s takes the time as a prop instead of reading it', (name) => {
    const source = readFileSync(join(DASHBOARD_DIR, name), 'utf8')
    const lines = source.split('\n')

    const offenders = lines
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(
        ({ line }) =>
          // Comments explaining the rule are not violations of it.
          !line.startsWith('*') &&
          !line.startsWith('//') &&
          (/new Date\(\s*\)/.test(line) || /Date\.now\(\s*\)/.test(line)),
      )
      .map(({ line, number }) => `${name}:${number} ${line}`)

    expect(offenders).toEqual([])
  })
})
