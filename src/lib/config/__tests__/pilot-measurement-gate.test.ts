import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * `BrandFeatures.pilotMeasurement` has to actually gate something.
 *
 * The flag itself is trivially assertable in brand.test.ts — and that assertion
 * is worth nothing on its own, because a boolean nobody reads is a dormant
 * switch, exactly what the BrandFeatures doc comment forbids. The failure this
 * file exists to catch is the one that leaves every other check green: someone
 * removes the guard from a page, the flag keeps its value, brand.test.ts still
 * passes, tsc passes, and a WG household is once again asked to enter how many
 * conflicts per month it used to have.
 *
 * These are source scans rather than render tests because both surfaces are
 * async server components reading Prisma; standing that up in Jest would test
 * the harness, not the boundary. Deleting a guard deletes the token this file
 * looks for, so the gate fails by mutation.
 */

const ANALYTICS = join(process.cwd(), 'src/app/(admin)/analytics/page.tsx')
const SETTINGS = join(process.cwd(), 'src/app/(admin)/settings/page.tsx')

const FLAG = 'pilotMeasurement'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('pilotMeasurement gates the surfaces it names', () => {
  it('does not compute the KPIs when the brand has no pilot', () => {
    const source = read(ANALYTICS)
    const call = source.indexOf('calculateMissionKPIs(6)')

    expect(call).toBeGreaterThan(-1)
    // The call must sit on the true side of a conditional, not run every load.
    // Gating only the JSX still pays for four queries nothing renders.
    // Additional conditions may stand beside the flag — the housing check does,
    // since these four numbers are housing reporting and a Jobcoach may not
    // read it. What must hold is that the flag is ON the true side, not that it
    // is the ONLY thing there; pinning the exact expression would fail the next
    // legitimate narrowing rather than an actual regression.
    const line = source.slice(source.lastIndexOf('\n', call) + 1, source.indexOf('\n', call))
    expect(line).toMatch(new RegExp(`${FLAG}\\s*(&&[^?]*)?\\?`))
  })

  it('does not render the Mission-KPI block when the brand has no pilot', () => {
    const source = read(ANALYTICS)
    const guard = source.indexOf(FLAG)
    const render = source.indexOf('<MissionKPISection')

    expect(guard).toBeGreaterThan(-1)
    expect(render).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(render)
    // Rendered off a value that is null off-brand, so the block cannot appear
    // with empty data — an empty chart reads as a broken feature.
    expect(source).toMatch(/\{missionKPIs &&[^)]*\(/)
  })

  it('does not offer the Pilot-Baseline fieldset when the brand has no pilot', () => {
    const source = read(SETTINGS)
    const guard = source.indexOf(`BRAND.features.${FLAG}`)
    const fieldset = source.indexOf('PILOT_BASELINE_LABELS.sectionTitle')

    expect(guard).toBeGreaterThan(-1)
    expect(fieldset).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(fieldset)
  })

  it('reads the flag through BRAND rather than re-deriving it from the brand id', () => {
    // `BRAND.id === 'wg'` scattered through pages is how a feature ends up
    // half-on: the next brand added inherits whichever branch the author
    // happened to write. The flag is the SSOT; the id is not.
    for (const path of [ANALYTICS, SETTINGS]) {
      expect(read(path)).not.toMatch(/BRAND\.id\s*===/)
    }
  })
})
