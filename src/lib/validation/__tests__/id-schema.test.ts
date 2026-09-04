import { createId } from '@paralleldrive/cuid2'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  idSchema,
  OpportunityUpdateSchema,
  PlacementInputSchema,
  ResolveIncidentSchema,
} from '@/lib/validation'

/**
 * An id must be accepted by the same code that generates it.
 *
 * ## The bug
 *
 * Every id field validated `z.string().cuid()` — cuid **v1**, which requires a
 * leading `c`. Prisma minted cuid v1, so it held. The Drizzle migration moved
 * id generation to `@paralleldrive/cuid2`, whose ids begin with any letter,
 * and `.cuid()` rejects 96.5% of them.
 *
 * Every form that submits an id therefore stopped working for almost every row
 * created after that migration — and reported it as "Etwas ist schiefgelaufen",
 * because the ValidationError never reached the screen. Measured on the live
 * database on 2026-09-04: 122 of 123 housing units, 15 of 20 residents, 11 of
 * 17 placements and all 4 maintenance requests were uneditable.
 *
 * These tests generate ids with the REAL generator rather than hand-written
 * fixtures. A fixture is written by the same person who chose the validator and
 * will agree with it by construction — which is exactly how this survived.
 */

describe('the ids this database actually issues', () => {
  it('accepts a freshly generated id', () => {
    expect(idSchema.safeParse(createId()).success).toBe(true)
  })

  it('accepts a thousand of them — not merely the lucky ones', () => {
    // The old rule passed 3.5%, which is indistinguishable from working if you
    // only ever try one id and happen to draw a `c`.
    const rejected = Array.from({ length: 1000 }, createId).filter(
      (id) => !idSchema.safeParse(id).success,
    )
    expect(rejected).toEqual([])
  })

  it('still accepts the Prisma-era cuid v1 ids that remain in the database', () => {
    // Real shapes from the live rows that DID still work.
    for (const legacy of ['clxq1a2b3c4d5e6f7g8h9i0j', 'cm5k2p8q30000abcdefghijkl']) {
      expect({ legacy, ok: idSchema.safeParse(legacy).success }).toEqual({ legacy, ok: true })
    }
  })

  it('rejects only what is genuinely unusable', () => {
    expect(idSchema.safeParse('').success).toBe(false)
    expect(idSchema.safeParse('x'.repeat(65)).success).toBe(false)
  })
})

/** Complaints about an id field, and nothing else. */
function idIssues(parsed: { error?: { issues: { path: PropertyKey[] }[] } }): PropertyKey[] {
  return (parsed.error?.issues ?? [])
    .filter((issue) =>
      String(issue.path.at(-1) ?? '')
        .toLowerCase()
        .endsWith('id'),
    )
    .map((issue) => issue.path.join('.'))
}

describe('the schemas the forms actually submit through', () => {
  const id = createId()

  it('an opportunity edit accepts its own row id', () => {
    const parsed = OpportunityUpdateSchema.safeParse({
      id,
      title: 'Programmleiter*in',
      description: 'Leitung des Pilotprojekts.',
      organisation: 'AOZ',
      kind: 'EMPLOYMENT',
      permitRequirement: 'PERMIT_REQUIRED',
      status: 'PUBLISHED',
    })
    expect(parsed.success).toBe(true)
  })

  it('a placement accepts real resident and unit ids', () => {
    const parsed = PlacementInputSchema.safeParse({
      residentId: createId(),
      housingUnitId: createId(),
      startDate: '2026-09-04',
    })
    // Assert on the ID issues only — another field going missing later is a
    // different test's business, but an id must never be the complaint.
    expect(idIssues(parsed)).toEqual([])
  })

  it('resolving an incident accepts a real incident id', () => {
    const parsed = ResolveIncidentSchema.safeParse({
      incidentId: createId(),
      resolution: 'Gespräch geführt, Vereinbarung getroffen.',
    })
    expect(idIssues(parsed)).toEqual([])
  })
})

describe('nothing validates an id by its shape any more', () => {
  /**
   * The generator is allowed to change again — this is what makes that safe.
   * A shape assertion proves nothing an id lookup does not already prove, and
   * it cost most of the database the last time the generator moved.
   */
  const FILES = [
    'src/lib/validation/schemas.ts',
    'src/lib/validation/transfer.ts',
    'src/lib/actions/incidents.ts',
    'src/lib/actions/spots.ts',
  ]

  it.each(FILES)('%s uses no cuid matcher', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    // Comments are stripped first: the doc block above `idSchema` names the
    // retired rule on purpose, and a test that forbade saying its name would
    // delete the explanation along with the bug.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code).not.toMatch(/z\s*\.\s*string\s*\(\s*\)\s*\.\s*cuid2?\s*\(/)
  })
})
