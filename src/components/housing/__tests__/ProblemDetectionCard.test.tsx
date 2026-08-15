import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ProblemDetectionCard } from '../ProblemDetectionCard'
import type { ResidentSummary } from '@/lib/types'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/constants', () => ({
  AGE_RANGE_LABELS: { YOUNG_ADULT: '18-25', ADULT: '26-40', MIDDLE_AGED: '41-60', SENIOR: '60+' },
  LANGUAGE_LABELS: { de: 'Deutsch', en: 'Englisch', ar: 'Arabisch' },
  PROBLEM_DETECTION_LABELS: {
    noProblems: 'Keine Probleme erkannt',
    noProblemsDesc: 'Alle Bewohner passen gut zusammen.',
    problemsDetected: 'Probleme erkannt',
    adaptationIssues: 'mit Anpassungsproblemen',
    lowerCleanliness: 'niedrigere',
    higherCleanliness: 'höhere',
    higherNoiseTolerance: 'höhere',
    lowerNoiseTolerance: 'niedrigere',
    higherPrivacy: 'höheres',
    lowerPrivacy: 'niedrigeres',
    scaleCleanliness: (direction: string) => `Deutlich ${direction} Sauberkeit als Durchschnitt`,
    scaleNoise: (direction: string) => `Deutlich ${direction} Lärmtoleranz als Durchschnitt`,
    scalePrivacy: (direction: string) => `Deutlich ${direction} Bedürfnis nach Privatsphäre`,
    onlyNightOwl: 'Einzige Nachteule unter Frühaufstehern/Normalen',
    onlyEarlyBird: 'Einziger Frühaufsteher unter Nachteulen/Normalen',
    onlyExtrovert: 'Einziger Extrovertierter unter Introvertierten/Moderaten',
    onlyIntrovert: 'Einziger Introvertierter unter Extrovertierten/Moderaten',
    smokerInNonSmoking: 'Raucher in einer Nichtraucher-Wohnung',
    avgCompatibilityOnly: 'Durchschnittliche Kompatibilität nur',
    tip: 'Tipp:',
    tipMessage: 'Bewohner mit Anpassungsproblemen könnten in einer anderen Wohnung besser passen.',
    relocate: 'Umplatzieren',
  },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] ?? key,
}))

jest.mock('@/lib/utils', () => ({
  getScoreColorClass: (score: number) =>
    score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : 'score-medium',
}))

jest.mock('@/lib/config/thresholds', () => ({
  DISPLAY_LIMITS: { languagePreview: 2 },
}))

// --- Helpers ---

function makeResident(overrides: Partial<ResidentSummary> & { id: string }): ResidentSummary {
  return {
    id: overrides.id,
    code: overrides.code ?? `RES-${overrides.id}`,
    displayName: overrides.displayName ?? null,
    ageRange: overrides.ageRange ?? 'ADULT',
    gender: overrides.gender ?? 'PREFER_NOT_SAY',
    languages: overrides.languages ?? ['de'],
    socialStyle: overrides.socialStyle ?? 'MODERATE',
    sleepSchedule: overrides.sleepSchedule ?? 'STANDARD',
    smokingStatus: overrides.smokingStatus ?? 'NON_SMOKER',
    noiseTolerance: overrides.noiseTolerance ?? 3,
    cleanlinessPractice: overrides.cleanlinessPractice ?? 3,
    privacyNeed: overrides.privacyNeed ?? 3,
  }
}

function makeScore(residentId: string, comparedWithId: string, overallScore: number) {
  return { residentId, comparedWithId, overallScore }
}

const UNIT_ID = 'unit-1'
const NO_SCORES: ReturnType<typeof makeScore>[] = []

// --- Tests ---

describe('ProblemDetectionCard', () => {
  // ── All-clear state ───────────────────────────────────────────────────────

  it('shows all-clear when 0 residents', () => {
    render(<ProblemDetectionCard residents={[]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Keine Probleme erkannt')).toBeInTheDocument()
  })

  it('shows all-clear when only 1 resident', () => {
    render(<ProblemDetectionCard residents={[makeResident({ id: 'r1' })]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Keine Probleme erkannt')).toBeInTheDocument()
  })

  it('shows all-clear description', () => {
    render(<ProblemDetectionCard residents={[]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/Alle Bewohner passen gut zusammen/)).toBeInTheDocument()
  })

  it('shows all-clear when 2 compatible residents with no issues', () => {
    const r1 = makeResident({ id: 'r1', cleanlinessPractice: 3, noiseTolerance: 3, privacyNeed: 3 })
    const r2 = makeResident({ id: 'r2', cleanlinessPractice: 3, noiseTolerance: 3, privacyNeed: 3 })
    const scores = [makeScore('r1', 'r2', 85)]
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Keine Probleme erkannt')).toBeInTheDocument()
  })

  // ── Problems detected heading ─────────────────────────────────────────────

  it('shows "Probleme erkannt" heading when problems exist', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Probleme erkannt')).toBeInTheDocument()
  })

  it('shows affected resident count with "mit Anpassungsproblemen"', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getAllByText(/mit Anpassungsproblemen/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows tip message at the bottom', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/Tipp/)).toBeInTheDocument()
  })

  // ── Smoking mismatch ──────────────────────────────────────────────────────

  it('flags smoker among non-smokers', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER', code: 'RES-001' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Raucher in einer Nichtraucher-Wohnung')).toBeInTheDocument()
  })

  it('does not flag non-smokers', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'NON_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.queryByText('Raucher in einer Nichtraucher-Wohnung')).not.toBeInTheDocument()
  })

  // ── Scale outlier: cleanliness ────────────────────────────────────────────

  it('flags lower cleanliness outlier', () => {
    // avg ≈ 2.33; r3 has 1 → |1 - 2.33| = 1.33 — not enough. Use [1,1,5]: avg=2.33; 5-2.33=2.67 > 1.5
    const r1 = makeResident({ id: 'r1', cleanlinessPractice: 1 })
    const r2 = makeResident({ id: 'r2', cleanlinessPractice: 1 })
    const r3 = makeResident({ id: 'r3', cleanlinessPractice: 5, code: 'RES-003' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/höhere Sauberkeit als Durchschnitt/)).toBeInTheDocument()
  })

  it('flags higher cleanliness outlier', () => {
    // [5,5,1]: avg=3.67; 1-3.67=-2.67 → lower outlier
    const r1 = makeResident({ id: 'r1', cleanlinessPractice: 5 })
    const r2 = makeResident({ id: 'r2', cleanlinessPractice: 5 })
    const r3 = makeResident({ id: 'r3', cleanlinessPractice: 1, code: 'RES-LOW' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/niedrigere Sauberkeit als Durchschnitt/)).toBeInTheDocument()
  })

  // ── Scale outlier: noise tolerance ────────────────────────────────────────

  it('flags noise tolerance outlier', () => {
    // [1,1,5]: avg=2.33; r3 noiseTolerance=5 → 5-2.33=2.67 > 1.5 → "höhere"
    const r1 = makeResident({ id: 'r1', noiseTolerance: 1 })
    const r2 = makeResident({ id: 'r2', noiseTolerance: 1 })
    const r3 = makeResident({ id: 'r3', noiseTolerance: 5, code: 'RES-LOUD' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/höhere Lärmtoleranz als Durchschnitt/)).toBeInTheDocument()
  })

  // ── Scale outlier: privacy need ───────────────────────────────────────────

  it('flags privacy need outlier', () => {
    // [1,1,5]: avg=2.33; r3 privacyNeed=5 → 5-2.33=2.67 > 1.5 → "höheres"
    const r1 = makeResident({ id: 'r1', privacyNeed: 1 })
    const r2 = makeResident({ id: 'r2', privacyNeed: 1 })
    const r3 = makeResident({ id: 'r3', privacyNeed: 5, code: 'RES-PRIV' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/höheres Bedürfnis nach Privatsphäre/)).toBeInTheDocument()
  })

  // ── Categorical outlier: sleep schedule ───────────────────────────────────

  it('flags sole night owl among 3+ residents', () => {
    const r1 = makeResident({ id: 'r1', sleepSchedule: 'EARLY_BIRD' })
    const r2 = makeResident({ id: 'r2', sleepSchedule: 'EARLY_BIRD' })
    const r3 = makeResident({ id: 'r3', sleepSchedule: 'NIGHT_OWL', code: 'RES-OWL' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Einzige Nachteule unter Frühaufstehern/Normalen')).toBeInTheDocument()
  })

  it('flags sole early bird among 3+ residents', () => {
    const r1 = makeResident({ id: 'r1', sleepSchedule: 'NIGHT_OWL' })
    const r2 = makeResident({ id: 'r2', sleepSchedule: 'NIGHT_OWL' })
    const r3 = makeResident({ id: 'r3', sleepSchedule: 'EARLY_BIRD', code: 'RES-BIRD' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Einziger Frühaufsteher unter Nachteulen/Normalen')).toBeInTheDocument()
  })

  it('does not flag categorical outlier when only 2 residents', () => {
    const r1 = makeResident({ id: 'r1', sleepSchedule: 'EARLY_BIRD' })
    const r2 = makeResident({ id: 'r2', sleepSchedule: 'NIGHT_OWL' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.queryByText(/Einzige Nachteule/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Einziger Frühaufsteher/)).not.toBeInTheDocument()
  })

  // ── Categorical outlier: social style ─────────────────────────────────────

  it('flags sole extrovert among 3+ residents', () => {
    const r1 = makeResident({ id: 'r1', socialStyle: 'INTROVERTED' })
    const r2 = makeResident({ id: 'r2', socialStyle: 'INTROVERTED' })
    const r3 = makeResident({ id: 'r3', socialStyle: 'EXTROVERTED', code: 'RES-EXT' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Einziger Extrovertierter unter Introvertierten/Moderaten')).toBeInTheDocument()
  })

  it('flags sole introvert among 3+ residents', () => {
    const r1 = makeResident({ id: 'r1', socialStyle: 'EXTROVERTED' })
    const r2 = makeResident({ id: 'r2', socialStyle: 'EXTROVERTED' })
    const r3 = makeResident({ id: 'r3', socialStyle: 'INTROVERTED', code: 'RES-INT' })
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Einziger Introvertierter unter Extrovertierten/Moderaten')).toBeInTheDocument()
  })

  // ── Low compatibility warning ─────────────────────────────────────────────

  it('shows low-compatibility message when avgCompatibility < 70', () => {
    const r1 = makeResident({ id: 'r1' })
    const r2 = makeResident({ id: 'r2' })
    // avgCompatibility = 60 < 70; both residents share the same score so both show the message
    const scores = [makeScore('r1', 'r2', 60)]
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    expect(screen.getAllByText(/Durchschnittliche Kompatibilität nur/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/60%/).length).toBeGreaterThanOrEqual(1)
  })

  it('does not show low-compatibility message when avgCompatibility >= 70', () => {
    const r1 = makeResident({ id: 'r1' })
    const r2 = makeResident({ id: 'r2' })
    const scores = [makeScore('r1', 'r2', 75)]
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    expect(screen.queryByText(/Durchschnittliche Kompatibilität nur/)).not.toBeInTheDocument()
  })

  it('uses score 100 when no relevant scores for a resident', () => {
    // r1 has no scores → avgCompatibility = 100 → no low-compat issue
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    // Scores only for an unrelated pair
    const scores = [makeScore('r3', 'r4', 50)]
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    // r1 has smoker issue but avgCompatibility=100 so no low-compat message
    expect(screen.queryByText(/Durchschnittliche Kompatibilität nur/)).not.toBeInTheDocument()
  })

  // ── Resident row links ────────────────────────────────────────────────────

  it('links to resident profile', () => {
    const r1 = makeResident({ id: 'res-abc', smokingStatus: 'OUTDOOR_SMOKER', code: 'RES-ABC' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    const profileLinks = screen.getAllByRole('link', { name: /RES-ABC/ })
    expect(profileLinks.some(l => l.getAttribute('href') === '/residents/res-abc')).toBe(true)
  })

  it('links "Umplatzieren" to matching page with transfer param', () => {
    const r1 = makeResident({ id: 'res-xyz', smokingStatus: 'OUTDOOR_SMOKER', code: 'RES-XYZ' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('link', { name: 'Umplatzieren' })).toHaveAttribute(
      'href',
      '/matching?resident=res-xyz&transfer=1'
    )
  })

  it('shows average compatibility score in resident row', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    const scores = [makeScore('r1', 'r2', 65)]
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    // Both residents share the same score so both rows show Ø 65%
    expect(screen.getAllByText(/Ø 65%/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows resident code in the row', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER', code: 'RES-SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('RES-SMOKER')).toBeInTheDocument()
  })

  // ── Severity: critical ────────────────────────────────────────────────────

  it('applies critical styling when avgCompatibility < 50', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    const scores = [makeScore('r1', 'r2', 40)]
    const { container } = render(
      <ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />
    )
    expect(container.querySelector('.border-status-error\\/25')).toBeInTheDocument()
  })

  it('applies warning styling when avgCompatibility >= 50 and < 3 issues', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    const scores = [makeScore('r1', 'r2', 65)]
    const { container } = render(
      <ProblemDetectionCard residents={[r1, r2]} compatibilityScores={scores} housingUnitId={UNIT_ID} />
    )
    expect(container.querySelector('.border-status-warning\\/25')).toBeInTheDocument()
  })

  // ── Sort order ────────────────────────────────────────────────────────────

  it('sorts critical residents before warning residents', () => {
    // r1 (RES-CRIT, OUTDOOR_SMOKER): scores avg=(40+40)/2=40 → critical (avgCompat<50 + smoking issue)
    // r2 (RES-WARN, NON_SMOKER): scores avg=(40+80)/2=60 → warning (60<70 low-compat, >=50)
    // r3 (NON_SMOKER): scores avg=(40+80)/2=60 → warning (also flagged but not tested here)
    // nonSmokerCount=2, residents.length-1=2 → r1 gets smoking flag ✓
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER', code: 'RES-CRIT' })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER', code: 'RES-WARN' })
    const r3 = makeResident({ id: 'r3', smokingStatus: 'NON_SMOKER' })
    const scores = [
      makeScore('r1', 'r2', 40),
      makeScore('r1', 'r3', 40),
      makeScore('r2', 'r3', 80),
    ]
    render(<ProblemDetectionCard residents={[r1, r2, r3]} compatibilityScores={scores} housingUnitId={UNIT_ID} />)
    const allCodes = screen.getAllByText(/RES-(CRIT|WARN)/).map(el => el.textContent)
    const critIdx = allCodes.findIndex(c => c?.includes('CRIT'))
    const warnIdx = allCodes.findIndex(c => c?.includes('WARN'))
    expect(critIdx).toBeLessThan(warnIdx)
  })

  // ── Language preview ──────────────────────────────────────────────────────

  it('shows languages in resident row (up to languagePreview limit)', () => {
    const r1 = makeResident({ id: 'r1', smokingStatus: 'OUTDOOR_SMOKER', languages: ['de', 'en', 'ar'] })
    const r2 = makeResident({ id: 'r2', smokingStatus: 'NON_SMOKER' })
    render(<ProblemDetectionCard residents={[r1, r2]} compatibilityScores={NO_SCORES} housingUnitId={UNIT_ID} />)
    // languagePreview = 2, so only de+en shown, not ar
    expect(screen.getByText(/Deutsch/)).toBeInTheDocument()
    expect(screen.getByText(/Englisch/)).toBeInTheDocument()
    expect(screen.queryByText(/Arabisch/)).not.toBeInTheDocument()
  })
})
