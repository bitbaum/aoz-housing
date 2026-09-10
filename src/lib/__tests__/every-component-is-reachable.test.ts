import { execSync } from 'child_process'
import { basename } from 'path'

import { describe, expect, it } from 'vitest'

/**
 * A component nothing renders is not neutral — it is a bug waiting to be
 * mistaken for a feature.
 *
 * THIS RULE WAS EARNED THREE TIMES IN ONE WEEK, and the third one is the
 * reason it is a gate rather than a note:
 *
 * 1. `isHighMaintenance` — computed, stored, read by nobody.
 * 2. `isMilestoneDay` — exported and tested, called by nobody. It was the
 *    cooldown rule for a renewal reminder that never fired.
 * 3. `ApartmentNameEditor` — complete, translated into every locale, rendered
 *    by NOTHING. `/portal/apartment` had been retired to a redirect and its
 *    editor stayed behind, while `PATCH /api/portal/apartment` kept working:
 *    guarded, validated, audited, reachable by no control a resident could
 *    press. The portal showed "Singapur" and gave nobody a way to change it.
 *
 * The first two were internal. The third was a user-facing feature that
 * CLAUDE.md still documented as working — found by grep, not by any check.
 *
 * WHAT IT CANNOT SEE. This is a name-based scan, not a render graph. A
 * component reached only through a string registry or a dynamic import would
 * look dead to it; none exist today, and one arriving is a reason to teach
 * this test that shape, not to delete the test.
 *
 * ADDING TO THE EXEMPTION LIST IS THE DANGEROUS MOVE. An exemption without a
 * reason is how the four dead dashboard components lived for months behind the
 * words "kept for backward compatibility" — backward compatible with nothing,
 * since an app has no external callers. Every entry below states what it is
 * FOR and what would make it stop being exempt.
 */

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()

/**
 * A component may be referenced ONLY by itself, its own test, or a barrel and
 * still be exempt — but only with a reason someone can act on later.
 */
const EXEMPT: Record<string, string> = {
  // ── Design-system primitives ────────────────────────────────────────────
  // Built to be composed, and the design system is the SSOT the product is
  // meant to reach for rather than re-invent a fourth radius or meter. They
  // are exempt as VOCABULARY, not as code somebody forgot.
  //
  // What ends the exemption: if one is still unused when the next UI area
  // lands, it is not vocabulary, it is a guess — delete it then.
  'ChipSelect.tsx': 'forms primitive, barrel-exported; composed vocabulary, not a screen',
  'FormSection.tsx': 'forms primitive, barrel-exported; composed vocabulary, not a screen',
  'ScaleInput.tsx': 'forms primitive, barrel-exported; composed vocabulary, not a screen',
  'ProgressBar.tsx': 'ui primitive, barrel-exported; composed vocabulary, not a screen',
  'ScoreIndicator.tsx': 'ui primitive, barrel-exported; composed vocabulary, not a screen',

  // ── Superseded, and checked before exempting ────────────────────────────
  // A placement confirmation dialog surfacing fit score and blocking
  // conflicts. It reads as a SAFETY control, so it was verified rather than
  // waved through: /matching computes `apartmentFit.conflicts`, filters
  // BLOCKING out of its recommendations and collects them for display, so no
  // safety capability is lost by this sitting idle.
  //
  // It also renders a raw `residentCode`, which predates the residentName()
  // rule — reviving it as-is would reintroduce that defect.
  //
  // What ends the exemption: delete it once someone confirms the matching page
  // is the only placement path we want. It is kept only because deleting a
  // safety-shaped control deserves a deliberate decision, not a sweep.
  'PlacementConfirm.tsx': 'superseded by /matching, which enforces BLOCKING conflicts itself',
}

/** Components referenced only by themselves, their own test, or a barrel. */
function unreachableComponents(): string[] {
  const files = execSync(`find src/components -name '*.tsx' ! -path '*/__tests__/*' | sort`, {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)

  return files.filter((file) => {
    const name = basename(file, '.tsx')
    // `|| true` because grep exits 1 on no matches, which would abort execSync.
    const hits = execSync(
      `grep -rl "\\b${name}\\b" src --include=*.ts --include=*.tsx 2>/dev/null || true`,
      { cwd: ROOT, encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean)
      .filter((hit) => hit !== file)
      .filter((hit) => !hit.endsWith(`__tests__/${name}.test.tsx`))
      // A barrel re-export is not a use. This is exactly what made the four
      // dead dashboard components look alive.
      .filter((hit) => !hit.endsWith('/index.ts'))
      // THIS FILE MUST NOT COUNT AS A USE. The EXEMPT map below names each
      // component, so without this line the gate greps itself, finds its own
      // exemption list, and reports every exempted component as reachable —
      // passing while proving nothing. A repo-scanning gate indexes itself
      // unless told not to, and this one did on its first run.
      .filter((hit) => !hit.endsWith('every-component-is-reachable.test.ts'))

    return hits.length === 0
  })
}

describe('every component is reachable from the product', () => {
  const unreachable = unreachableComponents()

  it('finds components to check at all', () => {
    // Vacuity guard: a scan that silently matched nothing would pass forever.
    // This is the failure mode of a gate that indexes its own baseline.
    const total = execSync(`find src/components -name '*.tsx' ! -path '*/__tests__/*' | wc -l`, {
      cwd: ROOT,
      encoding: 'utf8',
    })
    expect(Number(total.trim())).toBeGreaterThan(100)
  })

  it('has no unreachable component that is not explained', () => {
    const unexplained = unreachable.map((f) => basename(f)).filter((name) => !(name in EXEMPT))

    // If this fails, the component is referenced only by itself, its own test,
    // or a barrel. Either wire it up — it may be a MISSING FEATURE, as
    // ApartmentNameEditor was — or delete it. Adding it to EXEMPT is the last
    // resort and needs a reason that says what would end the exemption.
    expect(unexplained).toEqual([])
  })

  it('every exemption states a reason', () => {
    // An exemption with an empty or throwaway reason is the "kept for backward
    // compatibility" comment again, which was false and outlived its author.
    for (const [name, reason] of Object.entries(EXEMPT)) {
      expect({ name, ok: reason.trim().length > 20 }).toEqual({ name, ok: true })
    }
  })

  it('has no exemption for a component that no longer exists', () => {
    // The other direction, and the one that rots quietly: a stale entry keeps
    // excusing a file that was deleted, and quietly widens the hole for the
    // next file that happens to share its name.
    const present = new Set(unreachable.map((f) => basename(f)))
    const stale = Object.keys(EXEMPT).filter((name) => !present.has(name))
    expect(stale).toEqual([])
  })
})
