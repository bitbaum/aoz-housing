import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { determinePrimaryAction, HeroAction, CriticalAlertBanner } from '../PrimaryActionHero'
import type { PrimaryActionType } from '../PrimaryActionHero'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/config/checkin-intervals', () => ({
  VERY_OVERDUE_THRESHOLD_DAYS: 14,
}))

jest.mock('@/lib/constants/labels', () => ({
  DASHBOARD_LABELS: {
    heroCriticalIncidentsSuffix: 'kritische Vorfälle',
    heroActionNow: 'Sofort bearbeiten',
    heroCheckInUrgentPrefix: 'Check-in dringend:',
    heroNotSeenSuffix: 'Tagen nicht gesehen',
    heroStartCheckIn: 'Check-in starten',
    heroPlaceResidentsSuffix: 'Bewohner platzieren',
    heroFreeBedsAvailableSuffix: 'freie Plätze verfügbar',
    actionStartMatching: 'Matching starten',
    heroOpenConflictsSuffix: 'offene Konflikte',
    heroMainProblemPrefix: 'Hauptproblem:',
    heroAnalyze: 'Analysieren',
    heroCheckInsPendingSuffix: 'Check-ins anstehend',
    heroNextPrefix: 'Nächster:',
    heroMonitorUnitsSuffix: 'Einheiten beobachten',
    heroHadSuffix: 'hatte',
    heroIncidentsSuffix: 'Vorfälle',
    heroReview: 'Überprüfen',
    allClearAllDone: 'Alles erledigt!',
    allClearNoDringend: 'Keine dringenden Aufgaben',
    actionCreateResident: 'Neuen Bewohner erfassen',
    tileSincePrefix: 'Seit',
    alertCriticalAttentionSuffix: 'kritische Vorfälle erfordern sofortige Aufmerksamkeit',
    alertEdit: 'Bearbeiten',
  },
  INCIDENT_TYPE_LABELS_SHORT: { NOISE: 'Lärm', CONFLICT: 'Konflikt' },
  UI_LABELS: { close: 'Schliessen' },
}))

// --- Fixtures ---

const EMPTY = {
  criticalIncidents: [] as Array<{ id: string; type: string; unitCode: string; unitId: string; daysSinceCreated: number }>,
  overdueCheckIns: [] as Array<{ id: string; residentCode: string; residentId: string; unitCode: string; daysSinceLastCheckIn: number; supportLevel: string; isVeryOverdue?: boolean }>,
  unplacedResidents: [] as Array<{ id: string; code: string; displayName: string | null; createdAt: Date }>,
  freeBeds: 5,
  problemUnits: [] as Array<{ id: string; code: string; incidentCount: number; problemScore: number; unresolvedCount: number; primaryIssue: string }>,
}

function makeIncident(id = 'i1', type = 'NOISE') {
  return { id, type, unitCode: 'A01', unitId: 'unit-1', daysSinceCreated: 2 }
}

function makeCheckIn(id = 'c1', daysSinceLastCheckIn = 10, isVeryOverdue = false) {
  return { id, residentCode: `RES-${id}`, residentId: `rid-${id}`, unitCode: 'B02', daysSinceLastCheckIn, supportLevel: 'STANDARD', isVeryOverdue }
}

function makeResident(id = 'r1') {
  return { id, code: `RES-${id}`, displayName: null, createdAt: new Date('2024-01-01') }
}

function makeProblem(id = 'p1', unresolvedCount = 2) {
  return { id, code: `U0${id}`, incidentCount: 3, problemScore: 8, unresolvedCount, primaryIssue: 'CONFLICT' }
}

// ─── determinePrimaryAction tests ────────────────────────────────────────────

describe('determinePrimaryAction', () => {
  // Priority 1: critical incidents
  it('returns type=critical when criticalIncidents present', () => {
    const result = determinePrimaryAction({ ...EMPTY, criticalIncidents: [makeIncident()] })
    expect(result.type).toBe('critical')
  })

  it('builds critical title with count and suffix', () => {
    const result = determinePrimaryAction({ ...EMPTY, criticalIncidents: [makeIncident('i1'), makeIncident('i2')] })
    expect(result.title).toContain('2')
    expect(result.title).toContain('kritische Vorfälle')
  })

  it('critical href links to first incident', () => {
    const result = determinePrimaryAction({ ...EMPTY, criticalIncidents: [makeIncident('inc-99')] })
    expect(result.href).toBe('/incidents/inc-99')
  })

  it('critical description includes incident type label and unit code', () => {
    const result = determinePrimaryAction({ ...EMPTY, criticalIncidents: [makeIncident('i1', 'NOISE')] })
    expect(result.description).toContain('Lärm')
    expect(result.description).toContain('A01')
  })

  // Priority 2: very overdue (isVeryOverdue flag)
  it('returns type=checkin (urgent) for isVeryOverdue check-in', () => {
    const result = determinePrimaryAction({
      ...EMPTY,
      overdueCheckIns: [makeCheckIn('c1', 10, true)],
    })
    expect(result.type).toBe('checkin')
    expect(result.title).toContain('Check-in dringend:')
  })

  // Priority 2: very overdue by day threshold (> VERY_OVERDUE_THRESHOLD_DAYS + 28 = 42)
  it('returns type=checkin (urgent) when daysSinceLastCheckIn > 42', () => {
    const result = determinePrimaryAction({
      ...EMPTY,
      overdueCheckIns: [makeCheckIn('c1', 43, false)],
    })
    expect(result.type).toBe('checkin')
    expect(result.title).toContain('Check-in dringend:')
  })

  it('does not trigger very-overdue for exactly 42 days', () => {
    const result = determinePrimaryAction({
      ...EMPTY,
      overdueCheckIns: [makeCheckIn('c1', 42, false)],
    })
    // Should fall through to priority 5 (regular overdue)
    expect(result.title).not.toContain('Check-in dringend:')
    expect(result.title).toContain('Check-ins anstehend')
  })

  // Priority 3: unplaced residents with free beds
  it('returns type=place when unplaced residents and free beds exist', () => {
    const result = determinePrimaryAction({ ...EMPTY, unplacedResidents: [makeResident()] })
    expect(result.type).toBe('place')
    expect(result.href).toBe('/matching')
  })

  it('does NOT return type=place when freeBeds === 0', () => {
    const result = determinePrimaryAction({ ...EMPTY, unplacedResidents: [makeResident()], freeBeds: 0 })
    // Falls through to later priorities (all clear since no others)
    expect(result.type).toBe('allclear')
  })

  // Priority 4: problem units with unresolved incidents
  it('returns type=problem (analyze) for unit with unresolvedCount > 0', () => {
    const result = determinePrimaryAction({ ...EMPTY, problemUnits: [makeProblem('p1', 2)] })
    expect(result.type).toBe('problem')
    expect(result.href).toBe('/housing/p1')
    expect(result.title).toContain('offene Konflikte')
  })

  // Priority 5: regular overdue check-ins
  it('returns type=checkin (regular) for overdue check-ins below very-overdue threshold', () => {
    const result = determinePrimaryAction({ ...EMPTY, overdueCheckIns: [makeCheckIn('c1', 10)] })
    expect(result.type).toBe('checkin')
    expect(result.title).toContain('Check-ins anstehend')
    expect(result.href).toBe('/residents/rid-c1')
  })

  // Priority 6: problem units with all resolved
  it('returns type=problem (review) for problem units with unresolvedCount === 0', () => {
    const result = determinePrimaryAction({ ...EMPTY, problemUnits: [makeProblem('p1', 0)] })
    expect(result.type).toBe('problem')
    expect(result.title).toContain('Einheiten beobachten')
  })

  // Priority ordering: critical beats everything
  it('prefers critical over very-overdue check-ins', () => {
    const result = determinePrimaryAction({
      ...EMPTY,
      criticalIncidents: [makeIncident()],
      overdueCheckIns: [makeCheckIn('c1', 50, true)],
    })
    expect(result.type).toBe('critical')
  })

  // All clear
  it('returns type=allclear when nothing is pending', () => {
    const result = determinePrimaryAction(EMPTY)
    expect(result.type).toBe('allclear')
    expect(result.href).toBe('/residents/new')
  })
})

// ─── HeroAction tests ─────────────────────────────────────────────────────────

describe('HeroAction', () => {
  function makeAction(overrides: Partial<PrimaryActionType> = {}): PrimaryActionType {
    return {
      type: 'allclear',
      title: 'Alles erledigt!',
      description: 'Keine dringenden Aufgaben',
      href: '/residents/new',
      buttonText: 'Neuen Bewohner erfassen',
      ...overrides,
    }
  }

  it('renders title', () => {
    render(<HeroAction action={makeAction()} />)
    expect(screen.getByRole('heading', { name: 'Alles erledigt!' })).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<HeroAction action={makeAction()} />)
    expect(screen.getByText('Keine dringenden Aufgaben')).toBeInTheDocument()
  })

  it('links to the action href', () => {
    render(<HeroAction action={makeAction({ href: '/incidents/i1' })} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/incidents/i1')
  })

  it('renders buttonText', () => {
    render(<HeroAction action={makeAction({ buttonText: 'Sofort bearbeiten' })} />)
    expect(screen.getAllByText(/Sofort bearbeiten/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the correct icon for type=critical (AlertTriangle)', () => {
    const { container } = render(<HeroAction action={makeAction({ type: 'critical' })} />)
    expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument()
  })

  it('renders the correct icon for type=checkin (Hand)', () => {
    const { container } = render(<HeroAction action={makeAction({ type: 'checkin' })} />)
    expect(container.querySelector('.lucide-hand')).toBeInTheDocument()
  })

  it('renders the correct icon for type=place (Home)', () => {
    const { container } = render(<HeroAction action={makeAction({ type: 'place' })} />)
    expect(container.querySelector('.lucide-house')).toBeInTheDocument()
  })

  it('renders the correct icon for type=allclear (Sparkles)', () => {
    const { container } = render(<HeroAction action={makeAction({ type: 'allclear' })} />)
    expect(container.querySelector('.lucide-sparkles')).toBeInTheDocument()
  })
})

// ─── CriticalAlertBanner tests ────────────────────────────────────────────────

describe('CriticalAlertBanner', () => {
  const incidents = [makeIncident('inc-1', 'NOISE')]

  it('renders incident count and attention suffix', () => {
    render(<CriticalAlertBanner incidents={incidents} />)
    expect(screen.getByText(/1 kritische Vorfälle/)).toBeInTheDocument()
  })

  it('renders incident type label and unit code', () => {
    render(<CriticalAlertBanner incidents={incidents} />)
    expect(screen.getByText(/Lärm.*A01/)).toBeInTheDocument()
  })

  it('renders edit link to first incident', () => {
    render(<CriticalAlertBanner incidents={incidents} />)
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toHaveAttribute('href', '/incidents/inc-1')
  })

  it('renders dismiss button with aria-label', () => {
    render(<CriticalAlertBanner incidents={incidents} />)
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('dismisses the banner when close button clicked', () => {
    render(<CriticalAlertBanner incidents={incidents} />)
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(screen.queryByText(/kritische Vorfälle/)).not.toBeInTheDocument()
  })

  it('shows banner again after re-render (state resets on mount)', () => {
    const { unmount } = render(<CriticalAlertBanner incidents={incidents} />)
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    unmount()
    render(<CriticalAlertBanner incidents={incidents} />)
    expect(screen.getByText(/kritische Vorfälle/)).toBeInTheDocument()
  })

  it('shows correct count when multiple incidents', () => {
    const multi = [makeIncident('i1'), makeIncident('i2'), makeIncident('i3')]
    render(<CriticalAlertBanner incidents={multi} />)
    expect(screen.getByText(/3 kritische Vorfälle/)).toBeInTheDocument()
  })

  it('falls back to raw type string for unknown incident type', () => {
    render(<CriticalAlertBanner incidents={[makeIncident('i1', 'UNKNOWN_TYPE')]} />)
    expect(screen.getByText(/UNKNOWN_TYPE/)).toBeInTheDocument()
  })
})
