import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import {
  URGENCY_BADGE_CLASS,
  URGENCY_BORDER_CLASS,
  URGENCY_VALUE_CLASS,
  urgencyForGoodStreak,
  urgencyForOpenCount,
  type Urgency,
} from '@/lib/config/urgency'

/**
 * Colour on the staff dashboard is a signal, and a signal only works if it is
 * scarce.
 *
 * The dashboard used to take a `color` prop naming a palette entry, and callers
 * used it to label categories — one tile orange, the next blue, a plain count
 * of free beds tinted like a warning. Five saturated hues on one screen meant
 * none of them stood out, including the critical incident, which is the only
 * thing on that page that has to.
 *
 * A grep for `bg-[#hex]` cannot catch that: every one of those colours came
 * from a legitimate design token. What was wrong was the RELATIONSHIP between
 * the colour and what it claimed to mean, so that is what is checked here.
 */

const DASHBOARD_DIR = join(process.cwd(), 'src', 'components', 'dashboard')

const ALL_URGENCIES: Urgency[] = ['neutral', 'ok', 'attention', 'critical']

/** Saturated status fill on something card-sized. @see the test that uses it. */
function paintedSurfaces(source: string): string[] {
  const SURFACE = /className=(?:"|\{`)([^"`]*)/g

  return Array.from(source.matchAll(SURFACE))
    .map((match) => match[1])
    .filter(
      (classes) =>
        // `(?![-/\w])` keeps tinted `/10`–`/15` fills out: those are badges.
        /bg-status-(error|warning|success|info)(?![-/\w])/.test(classes) &&
        /\bcard\b|\bp-[5-9]\b|\bpy-(?:8|10|12)\b/.test(classes),
    )
    .map((classes) => classes.trim())
}

function dashboardSources(): { file: string; source: string }[] {
  return readdirSync(DASHBOARD_DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => ({ file: name, source: readFileSync(join(DASHBOARD_DIR, name), 'utf8') }))
}

describe('the urgency scale is total', () => {
  it.each(ALL_URGENCIES)('%s maps to a value, badge and border class', (urgency) => {
    // A missing entry renders `undefined` into a className, which is invisible
    // in review and silently drops the styling.
    expect(typeof URGENCY_VALUE_CLASS[urgency]).toBe('string')
    expect(typeof URGENCY_BADGE_CLASS[urgency]).toBe('string')
    expect(typeof URGENCY_BORDER_CLASS[urgency]).toBe('string')
  })

  it('reserves a coloured card edge for critical alone', () => {
    const withBorder = ALL_URGENCIES.filter((u) => URGENCY_BORDER_CLASS[u] !== '')
    expect(withBorder).toEqual(['critical'])
  })

  it('leaves a neutral figure in the ordinary text colour', () => {
    // "Freie Plätze: 7" is a fact, not a verdict. Colouring it was the clearest
    // case of decoration pretending to be information.
    expect(URGENCY_VALUE_CLASS.neutral).toBe('text-ui-text')
  })
})

describe('grading counts', () => {
  it('treats zero open items as done, not as neutral', () => {
    expect(urgencyForOpenCount(0)).toBe('ok')
  })

  it('escalates as the pile grows', () => {
    expect(urgencyForOpenCount(1)).toBe('attention')
    expect(urgencyForOpenCount(4)).toBe('critical')
  })

  it('inverts for a streak, where more is better', () => {
    // Written once precisely because it is the opposite direction and was
    // previously re-typed as a ternary at every call site.
    expect(urgencyForGoodStreak(10)).toBe('ok')
    expect(urgencyForGoodStreak(4)).toBe('attention')
    expect(urgencyForGoodStreak(0)).toBe('critical')
  })
})

describe('dashboard components do not pick their own colours', () => {
  it('exposes no palette-named colour prop', () => {
    // `color="orange"` is the API that let colour become a category label.
    for (const { file, source } of dashboardSources()) {
      const paletteProp = /\bcolor[=:]\s*['"](orange|blue|green|yellow|red|gray)['"]/.exec(source)

      expect({ file, paletteProp: paletteProp?.[0] ?? null }).toEqual({ file, paletteProp: null })
    }
  })

  it('never paints a whole card in a saturated status colour', () => {
    /**
     * The regression this pins is a SURFACE painted at full strength — the
     * hero used to be `bg-status-warning` on a `rounded-lg p-6 md:p-8` block,
     * a hand-sized orange rectangle announcing a routine check-in.
     *
     * Deliberately NOT flagged, because they are marks rather than surfaces
     * and do not compete for attention: a 10px legend dot beside its own
     * label, a notification counter, and tinted `/10`–`/15` badge fills. The
     * critical alert banner is the one saturated surface the system allows,
     * and it is the one thing on the page that must win.
     */
    const offenders = dashboardSources().flatMap(({ file, source }) =>
      paintedSurfaces(source).map((classes) => `${file}: ${classes}`),
    )

    expect(offenders).toEqual([])
  })

  it('would catch the slab it replaced', () => {
    // A rule that has never fired is a rule nobody has checked. This is the
    // exact className the hero carried before, and the detector must see it —
    // otherwise the assertion above passes because it finds nothing anywhere.
    const oldHero = 'className="block rounded-lg p-6 md:p-8 bg-status-warning text-ui-on-accent"'

    expect(paintedSurfaces(oldHero)).toHaveLength(1)
  })

  it('leaves legend dots and counters alone', () => {
    // The other direction: a rule that flags every mark would be turned off
    // within a week.
    const dot = 'className={`w-2.5 h-2.5 rounded-full ${color}`}'
    const counter = 'className="absolute -top-1.5 bg-status-error rounded-full w-5 h-5"'
    const tinted = 'className="card bg-status-success/10 border-status-success/25"'

    expect([
      ...paintedSurfaces(dot),
      ...paintedSurfaces(counter),
      ...paintedSurfaces(tinted),
    ]).toEqual([])
  })

  it('does not animate an alert forever', () => {
    // Continuous motion on a red bar is an accessibility problem for
    // vestibular and attention disorders, and it made the page read as alarmed
    // rather than making one item stand out.
    for (const { file, source } of dashboardSources()) {
      expect({ file, pulses: source.includes('animate-pulse') }).toEqual({ file, pulses: false })
    }
  })
})
