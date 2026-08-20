/**
 * Gate: a resident row that crosses into a client component carries only the
 * fields the UI renders — never caseworker notes or medical documentation.
 *
 * The housing-detail page (`app/(admin)/housing/[id]/page.tsx`) reads WHOLE
 * Resident rows because the server-side compatibility math needs the full
 * functional field set. Those rows were then passed directly into client
 * components typed with the narrow `ResidentSummary`/`…HouseholdProfile`/
 * `…Basic`. TypeScript accepts the wider object (structural typing) and
 * compiles green — but Next serializes the object actually passed into the
 * page's HTML flight payload, so `notes`, `bio`, `supportLevel` and the
 * `medicalDoc*` fields (about refugees) shipped to the browser on a staff
 * screen. The type annotation protected nothing; only projecting in code does.
 *
 * `toResidentUiSummary` (lib/housing/resident-ui.ts) is that projection. This
 * test pins two things: the projection drops every sensitive field, and the
 * page does not regress to passing a raw row.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Resident } from '@prisma/client'
import { toResidentUiSummary } from '@/lib/housing/resident-ui'

/** Fields that must never reach a client component (and thus the flight payload). */
const SENSITIVE_FIELDS = [
  'notes',
  'bio',
  'supportLevel',
  'hasMedicalDocumentation',
  'medicalDocType',
  'medicalDocDate',
  'medicalDocNotes',
] as const

// A row with every sensitive field populated, so a leak would be visible.
const fullRow = {
  id: 'r1',
  code: 'RES-TEST01',
  displayName: 'A. Person',
  ageRange: 'AGE_30_44',
  gender: 'FEMALE',
  languages: ['de', 'fa'],
  socialStyle: 'BALANCED',
  sleepSchedule: 'EARLY',
  smokingStatus: 'NON_SMOKER',
  noiseTolerance: 'MEDIUM',
  cleanlinessPractice: 'HIGH',
  privacyNeed: 'MEDIUM',
  choresContribution: 'FAIR_SHARE',
  // sensitive — must be stripped
  notes: 'caseworker note: fled via Türkiye, ongoing trauma therapy',
  bio: 'likes cooking',
  supportLevel: 'INTENSIVE',
  hasMedicalDocumentation: true,
  medicalDocType: 'DISABILITY',
  medicalDocDate: new Date('2026-01-01'),
  medicalDocNotes: 'wheelchair, ground floor only',
} as unknown as Resident

describe('toResidentUiSummary — what may reach a client component', () => {
  const view = toResidentUiSummary(fullRow) as Record<string, unknown>

  it.each(SENSITIVE_FIELDS)('strips %s', (field) => {
    expect(field in view).toBe(false)
  })

  it('does not smuggle a sensitive value through serialization', () => {
    const serialized = JSON.stringify(view)
    expect(serialized).not.toContain('caseworker note')
    expect(serialized).not.toContain('trauma therapy')
    expect(serialized).not.toContain('wheelchair')
    expect(serialized).not.toContain('INTENSIVE')
  })

  it('keeps the fields the housing UI actually renders', () => {
    for (const f of ['id', 'code', 'displayName', 'ageRange', 'gender', 'languages', 'choresContribution']) {
      expect(f in view).toBe(true)
    }
  })
})

describe('housing/[id]/page.tsx does not pass a raw resident row to a client component', () => {
  const page = readFileSync(
    join(process.cwd(), 'src/app/(admin)/housing/[id]/page.tsx'),
    'utf8',
  )

  // The four client components on this page receive resident rows. Passing the
  // whole row (`p.resident` / a bare `resident`) is the leak; each must go
  // through the projection. Assert the raw, unmapped shape is absent.
  it('routes every placement row through toResidentUiSummary', () => {
    expect(page).toContain('toResidentUiSummary')
    // the pre-fix pattern — a raw row straight into a `residents=` prop
    expect(page).not.toMatch(/residents=\{unit\.placements\.map\(p => p\.resident\)\}/)
  })
})
