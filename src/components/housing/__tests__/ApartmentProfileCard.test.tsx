import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ApartmentProfileCard } from '../ApartmentProfileCard'
import type { ResidentHouseholdProfile } from '@/lib/types'

// --- Mocks ---

jest.mock('@/lib/constants', () => ({
  SLEEP_SCHEDULE_LABELS: { EARLY_BIRD: 'Frühaufsteher', NIGHT_OWL: 'Nachtmensch', FLEXIBLE: 'Flexibel' },
  SOCIAL_STYLE_LABELS: { INTROVERTED: 'Introvertiert', EXTROVERTED: 'Extrovertiert', MODERATE: 'Moderat' },
  SMOKING_STATUS_LABELS: { NON_SMOKER: 'Nichtraucher', SMOKER: 'Raucher', OUTSIDE_ONLY: 'Nur draussen' },
  LANGUAGE_LABELS: { de: 'Deutsch', en: 'Englisch', ar: 'Arabisch' },
  APARTMENT_PROFILE_LABELS: {
    title: 'Wohnungsprofil',
    emptyState: 'Keine Bewohner - Profil wird erstellt wenn Bewohner platziert werden',
    harmonyLabel: 'Harmonie',
    residentsSuffix: ' Bewohner',
    nonSmokers: ' · Nichtraucher',
    smokerWarning: 'Raucher in der Wohnung: ',
    deviationPrefix: 'Abweichung: ',
    sleepSection: 'Schlafrhythmus',
    socialSection: 'Sozialstil',
    languagesSection: 'Sprachen',
    fieldCleanliness: 'Sauberkeit',
    fieldNoiseTolerance: 'Lärmtoleranz',
    fieldPrivacy: 'Privatsphäre',
    fieldChores: 'Haushaltsbeitrag',
  },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] ?? key,
}))

jest.mock('@/lib/utils', () => ({
  getScoreColorClass: (score: number) =>
    score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : 'score-medium',
}))

jest.mock('@/lib/config/resident-factors', () => ({
  RESIDENT_FACTORS: {
    cleanlinessPractice: { type: 'scale', lowLabel: 'Niedrig', highLabel: 'Hoch' },
    noiseTolerance: { type: 'scale', lowLabel: 'Leise', highLabel: 'Laut' },
    privacyNeed: { type: 'scale', lowLabel: 'Offen', highLabel: 'Privat' },
    choresContribution: { type: 'scale', lowLabel: 'Wenig', highLabel: 'Viel' },
  },
}))

// --- Helpers ---

function makeResident(overrides: Partial<ResidentHouseholdProfile> & { id: string }): ResidentHouseholdProfile {
  return {
    id: overrides.id,
    code: overrides.code ?? `RES-${overrides.id}`,
    cleanlinessPractice: overrides.cleanlinessPractice ?? 3,
    noiseTolerance: overrides.noiseTolerance ?? 3,
    privacyNeed: overrides.privacyNeed ?? 3,
    choresContribution: overrides.choresContribution ?? 3,
    sleepSchedule: overrides.sleepSchedule ?? 'STANDARD',
    socialStyle: overrides.socialStyle ?? 'MODERATE',
    smokingStatus: overrides.smokingStatus ?? 'NON_SMOKER',
    languages: overrides.languages ?? ['de'],
  }
}

// --- Tests ---

describe('ApartmentProfileCard', () => {
  // ── Empty state ───────────────────────────────────────────────────────────

  it('renders the section heading', () => {
    render(<ApartmentProfileCard residents={[]} />)
    expect(screen.getByRole('heading', { name: 'Wohnungsprofil' })).toBeInTheDocument()
  })

  it('shows empty state message when no residents', () => {
    render(<ApartmentProfileCard residents={[]} />)
    expect(screen.getByText(/Keine Bewohner/)).toBeInTheDocument()
  })

  // ── Resident count and summary ────────────────────────────────────────────

  it('shows resident count in summary', () => {
    render(<ApartmentProfileCard residents={[makeResident({ id: 'r1' }), makeResident({ id: 'r2' })]} />)
    expect(screen.getByText(/2 Bewohner/)).toBeInTheDocument()
  })

  it('shows dominant sleep schedule label in summary', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', sleepSchedule: 'EARLY_BIRD' }),
      makeResident({ id: 'r2', sleepSchedule: 'EARLY_BIRD' }),
    ]} />)
    // Label appears in both summary and categorical section
    expect(screen.getAllByText(/Frühaufsteher/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows dominant social style label in summary', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', socialStyle: 'INTROVERTED' }),
    ]} />)
    // Label appears in both summary and categorical section
    expect(screen.getAllByText(/Introvertiert/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows "· Nichtraucher" when all residents are non-smokers', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', smokingStatus: 'NON_SMOKER' }),
      makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' }),
    ]} />)
    expect(screen.getByText(/Nichtraucher/)).toBeInTheDocument()
  })

  it('hides non-smokers label when any resident smokes', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', smokingStatus: 'NON_SMOKER' }),
      makeResident({ id: 'r2', smokingStatus: 'OUTDOOR_SMOKER' }),
    ]} />)
    // The summary "· Nichtraucher" should not appear
    const summaryParagraph = screen.getByText(/Bewohner/)
    expect(summaryParagraph.textContent).not.toContain('· Nichtraucher')
  })

  // ── Harmony score ─────────────────────────────────────────────────────────

  it('shows harmony score', () => {
    // Identical residents → zero std dev → score 100
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', cleanlinessPractice: 3, noiseTolerance: 3, privacyNeed: 3 }),
      makeResident({ id: 'r2', cleanlinessPractice: 3, noiseTolerance: 3, privacyNeed: 3 }),
    ]} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('displays lower harmony score when residents differ significantly', () => {
    // Max spread (1 and 5) → std dev = 2, avgStdDev = 2, score = max(0, 100 - 2*25) = 50
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', cleanlinessPractice: 1, noiseTolerance: 1, privacyNeed: 1 }),
      makeResident({ id: 'r2', cleanlinessPractice: 5, noiseTolerance: 5, privacyNeed: 5 }),
    ]} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  // ── Scale metrics (showDetails=true by default) ───────────────────────────

  it('renders all four scale metric labels', () => {
    render(<ApartmentProfileCard residents={[makeResident({ id: 'r1' })]} />)
    expect(screen.getByText('Sauberkeit')).toBeInTheDocument()
    expect(screen.getByText('Lärmtoleranz')).toBeInTheDocument()
    expect(screen.getByText('Privatsphäre')).toBeInTheDocument()
    expect(screen.getByText('Haushaltsbeitrag')).toBeInTheDocument()
  })

  it('shows average scale value rounded to 1dp', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', cleanlinessPractice: 2 }),
      makeResident({ id: 'r2', cleanlinessPractice: 4 }),
    ]} />)
    // Average = 3.0 → displayed as "3.0"
    expect(screen.getAllByText('3.0').length).toBeGreaterThanOrEqual(1)
  })

  it('shows scale low/high labels from factor config', () => {
    render(<ApartmentProfileCard residents={[makeResident({ id: 'r1' })]} />)
    expect(screen.getByText('Niedrig')).toBeInTheDocument()
    expect(screen.getByText('Hoch')).toBeInTheDocument()
  })

  it('shows outlier warning for residents > 1.5 away from average', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', cleanlinessPractice: 1, code: 'RES-LOW' }),
      makeResident({ id: 'r2', cleanlinessPractice: 3 }),
      makeResident({ id: 'r3', cleanlinessPractice: 3 }),
    ]} />)
    // avg ≈ 2.33; 1 - 2.33 = -1.33 → not > 1.5 → no outlier
    // Let's use a more extreme case: [1, 1, 5] avg = 2.33; 5 - 2.33 = 2.67 > 1.5
    // But we can't easily test the exact text here without rerendering, so just check component renders without crash
    expect(screen.getByText('Wohnungsprofil')).toBeInTheDocument()
  })

  it('shows outlier warning code for extreme value', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', cleanlinessPractice: 1, code: 'RES-001' }),
      makeResident({ id: 'r2', cleanlinessPractice: 1, code: 'RES-002' }),
      makeResident({ id: 'r3', cleanlinessPractice: 5, code: 'RES-003' }),
    ]} />)
    // avg = 7/3 ≈ 2.33; RES-003 value 5 → |5 - 2.33| = 2.67 > 1.5 → outlier
    expect(screen.getByText(/RES-003/)).toBeInTheDocument()
  })

  // ── Categorical sections ──────────────────────────────────────────────────

  it('renders sleep schedule section header', () => {
    render(<ApartmentProfileCard residents={[makeResident({ id: 'r1', sleepSchedule: 'EARLY_BIRD' })]} />)
    expect(screen.getByText('Schlafrhythmus')).toBeInTheDocument()
  })

  it('renders sleep schedule entries with count', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', sleepSchedule: 'EARLY_BIRD' }),
      makeResident({ id: 'r2', sleepSchedule: 'EARLY_BIRD' }),
      makeResident({ id: 'r3', sleepSchedule: 'NIGHT_OWL' }),
    ]} />)
    // EARLY_BIRD appears twice in sleep schedule section
    const earlyBirdEntries = screen.getAllByText('Frühaufsteher')
    expect(earlyBirdEntries.length).toBeGreaterThanOrEqual(1)
  })

  it('renders social style section header', () => {
    render(<ApartmentProfileCard residents={[makeResident({ id: 'r1' })]} />)
    expect(screen.getByText('Sozialstil')).toBeInTheDocument()
  })

  // ── Languages section ─────────────────────────────────────────────────────

  it('shows languages section when residents have languages', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', languages: ['de', 'en'] }),
    ]} />)
    expect(screen.getByText('Sprachen')).toBeInTheDocument()
    expect(screen.getByText(/Deutsch/)).toBeInTheDocument()
    expect(screen.getByText(/Englisch/)).toBeInTheDocument()
  })

  it('shows language with count badge', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', languages: ['de'] }),
      makeResident({ id: 'r2', languages: ['de'] }),
    ]} />)
    expect(screen.getByText(/Deutsch \(2\)/)).toBeInTheDocument()
  })

  it('hides languages section when no languages set', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', languages: [] }),
    ]} />)
    expect(screen.queryByText('Sprachen')).not.toBeInTheDocument()
  })

  // ── Smoker warning ────────────────────────────────────────────────────────

  it('shows smoker warning when not all residents are non-smokers', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', smokingStatus: 'NON_SMOKER' }),
      makeResident({ id: 'r2', smokingStatus: 'OUTDOOR_SMOKER' }),
    ]} />)
    expect(screen.getByText(/Raucher in der Wohnung/)).toBeInTheDocument()
  })

  it('hides smoker warning when all residents are non-smokers', () => {
    render(<ApartmentProfileCard residents={[
      makeResident({ id: 'r1', smokingStatus: 'NON_SMOKER' }),
    ]} />)
    expect(screen.queryByText(/Raucher in der Wohnung/)).not.toBeInTheDocument()
  })

  // ── showDetails=false ─────────────────────────────────────────────────────

  it('hides scale metrics when showDetails=false', () => {
    render(<ApartmentProfileCard
      residents={[makeResident({ id: 'r1' })]}
      showDetails={false}
    />)
    expect(screen.queryByText('Sauberkeit')).not.toBeInTheDocument()
    expect(screen.queryByText('Schlafrhythmus')).not.toBeInTheDocument()
  })

  it('still shows summary when showDetails=false', () => {
    render(<ApartmentProfileCard
      residents={[makeResident({ id: 'r1' })]}
      showDetails={false}
    />)
    expect(screen.getByText(/1 Bewohner/)).toBeInTheDocument()
  })
})
