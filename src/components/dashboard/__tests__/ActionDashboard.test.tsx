import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ActionDashboard } from '../ActionDashboard'

// --- Mocks ---

jest.mock('../PrimaryActionHero', () => ({
  HeroAction: ({ action }: { action: { type: string } }) => (
    <div data-testid="hero-action" data-type={action?.type ?? 'none'} />
  ),
  CriticalAlertBanner: ({ incidents }: { incidents: Array<{ id: string }> }) => (
    <div data-testid="critical-banner" data-count={incidents.length} />
  ),
  determinePrimaryAction: jest.fn(() => ({ type: 'ALL_GOOD', label: 'OK', href: '/', color: 'green' })),
}))

jest.mock('../QuickStatsRow', () => ({
  QuickStat: ({ label, value }: { label: string; value: number }) => (
    <div data-testid="quick-stat">{label}: {value}</div>
  ),
}))

jest.mock('../ActionTilesGrid', () => ({
  ActionTile: ({ title, count }: { title: string; count: number }) => (
    <div data-testid="action-tile">{title} ({count})</div>
  ),
}))

jest.mock('../AllClearState', () => ({
  AllClearState: () => <div data-testid="all-clear-state" />,
  QuickActionsBar: ({ unplacedCount, freeBeds }: { unplacedCount: number; freeBeds: number }) => (
    <div data-testid="quick-actions-bar" data-unplaced={unplacedCount} data-free={freeBeds} />
  ),
}))

jest.mock('@/lib/config/thresholds', () => ({
  DISPLAY_LIMITS: { dashboardItems: 3 },
}))

jest.mock('@/lib/constants/labels', () => ({
  DASHBOARD_LABELS: {
    greetingMorning: 'Guten Morgen',
    greetingDay: 'Guten Tag',
    greetingEvening: 'Guten Abend',
    today: 'heute',
    yesterday: 'gestern',
    daysAgo: 'Tagen',
    allClearSummary: 'Alles unter Kontrolle heute.',
    oneTaskWaiting: '1 Aufgabe wartet auf Sie.',
    tasksWaitingSuffix: 'Aufgaben warten auf Sie.',
    sectionOpenTasks: 'Offene Aufgaben',
    sectionDueSoon: 'Bald fällig',
    statFreeBeds: 'Freie Plätze',
    statCheckIns: 'Check-ins',
    statOverdueSuffix: 'überfällig',
    statNoneCurrent: 'Keine aktuell',
    statAllCurrent: 'Alle aktuell',
    statCurrentSuffix: 'aktuell',
    statHarmony: 'Harmonie',
    statDaysSuffix: 'Tage',
    statDaySuffixSingular: 'Tag',
    statNoConflicts: 'Keine Konflikte',
    statMaintenance: 'Wartung',
    statOpenSuffix: 'offen',
    statLearning: 'Lernen & Kurse',
    statRunningSuffix: 'laufend',
    statLearningCompletions: (n: number) => `${n} Abschlüsse in 30 Tagen`,
    statEvents: 'Veranstaltungen',
    statPlannedSuffix: 'geplant',
    occupancyOccupied: 'belegt',
    tileCheckIns: 'Check-ins durchführen',
    tilePlaceResidents: 'Bewohner platzieren',
    tileTransferRequests: 'Verlegungsanfragen prüfen',
    tileTransferRequestsDesc: 'Klient*innen warten auf eine Antwort',
    tileProposals: 'Beschlüsse bestätigen',
    tileProposalsDesc: 'Häuser warten auf eine Antwort der Betreuung',
    tileConflictUnits: 'Einheiten mit Konflikten',
    tileConflictUnitsDesc: 'Wiederholte Vorfälle',
    tileWaitingLongestSuffix: 'wartet am längsten',
    tileCheckInsThisWeek: 'Check-ins diese Woche',
    tilePlanProactively: 'Proaktiv planen',
    tileSincePrefix: 'Seit',
    dueTodayPrefix: 'Heute fällig',
    dueTomorrowPrefix: 'Morgen fällig',
    dueInPrefix: 'In',
    dueInSuffix: 'Tagen',
    tileIncidents: 'Vorfälle',
  },
  INCIDENT_TYPE_LABELS_SHORT: { NOISE: 'Lärm' },
}))

// --- Helpers ---

const BASE_PROPS = {
  role: 'ADMIN' as const,
  occupiedBeds: 10,
  totalBeds: 20,
  totalPlacements: 15,
  overdueCheckIns: [],
  dueSoonCheckIns: [],
  unplacedResidents: [],
  criticalIncidents: [],
  problemUnits: [],
  pendingTransfers: [],
  proposalsAwaitingStaff: [],
  conflictFreeDays: 14,
  openMaintenanceCount: 0,
  learningInProgressCount: 0,
  learningRecentCompletions: 0,
  upcomingEventsCount: 0,
  // Fixed strings, because they are now computed on the server and passed in.
  // The component no longer reads a clock, which is what makes its output the
  // same in the container and in the browser.
  greeting: 'Guten Tag',
  todayLabel: 'Sonntag, 16. August',
}

function makeCheckIn(id: string) {
  return { id, residentCode: `RES-${id}`, residentDisplayName: null, residentId: `rid-${id}`, unitCode: 'A01', daysSinceLastCheckIn: 8, supportLevel: 'STANDARD' }
}

function makeResident(id: string) {
  return { id, code: `RES-${id}`, displayName: null, createdAt: new Date('2024-01-01') }
}

function makeIncident(id: string) {
  return { id, type: 'NOISE', unitCode: 'B02', unitId: 'unit-1', daysSinceCreated: 2 }
}

function makeProblemUnit(id: string) {
  return { id, code: `U0${id}`, incidentCount: 3, problemScore: 8, unresolvedCount: 1, primaryIssue: 'NOISE' }
}

function makeDueSoon(id: string, daysUntilDue = 2) {
  return { id, residentCode: `RES-${id}`, residentDisplayName: null, residentId: `rid-${id}`, unitCode: 'C03', daysUntilDue, supportLevel: 'STANDARD' }
}

function makeTransfer(id: string) {
  return { id, residentCode: `RES-${id}`, residentDisplayName: null, unitCode: 'A01', daysSinceCreated: 4 }
}

function makeProposal(id: string) {
  return { id, title: 'Ruhezeiten ab 21 Uhr', unitCode: 'A01', daysWaiting: 3 }
}

// --- Tests ---

describe('ActionDashboard', () => {
  // ── Summary message ───────────────────────────────────────────────────────

  it('shows "Alles unter Kontrolle" when no issues', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.getByText('Alles unter Kontrolle heute.')).toBeInTheDocument()
  })

  it('shows singular task message when exactly 1 issue', () => {
    render(<ActionDashboard {...BASE_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.getByText('1 Aufgabe wartet auf Sie.')).toBeInTheDocument()
  })

  it('shows plural tasks message when more than 1 issue', () => {
    render(<ActionDashboard {...BASE_PROPS}
      overdueCheckIns={[makeCheckIn('c1')]}
      unplacedResidents={[makeResident('r1')]}
    />)
    expect(screen.getByText(/2 Aufgaben warten auf Sie/)).toBeInTheDocument()
  })

  // ── CTA hierarchy ─────────────────────────────────────────────────────────

  it('does not render the legacy quick-action bar above the primary action', () => {
    render(<ActionDashboard {...BASE_PROPS} occupiedBeds={10} totalBeds={20} />)
    expect(screen.queryByTestId('quick-actions-bar')).not.toBeInTheDocument()
  })

  it('routes unplaced residents into the open task list instead of another CTA bar', () => {
    render(<ActionDashboard {...BASE_PROPS} unplacedResidents={[makeResident('r1'), makeResident('r2')]} />)
    expect(screen.queryByTestId('quick-actions-bar')).not.toBeInTheDocument()
    expect(screen.getByText('Bewohner platzieren (2)')).toBeInTheDocument()
  })

  // ── Critical alert banner ─────────────────────────────────────────────────

  it('shows CriticalAlertBanner when criticalIncidents > 0', () => {
    render(<ActionDashboard {...BASE_PROPS} criticalIncidents={[makeIncident('i1')]} />)
    expect(screen.getByTestId('critical-banner')).toBeInTheDocument()
  })

  it('hides CriticalAlertBanner when no criticalIncidents', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.queryByTestId('critical-banner')).not.toBeInTheDocument()
  })

  // ── HeroAction ────────────────────────────────────────────────────────────

  it('always renders HeroAction', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.getByTestId('hero-action')).toBeInTheDocument()
  })

  // ── QuickStats row ────────────────────────────────────────────────────────

  it('renders all 6 QuickStat tiles for ADMIN', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.getAllByTestId('quick-stat')).toHaveLength(6)
  })

  it('renders only the learning stat for JOBCOACH', () => {
    render(<ActionDashboard {...BASE_PROPS} role="JOBCOACH" learningInProgressCount={4} />)
    const stats = screen.getAllByTestId('quick-stat')
    expect(stats).toHaveLength(1)
    expect(stats[0]).toHaveTextContent('Lernen & Kurse: 4')
  })

  it('renders learning and events stats for FREIWILLIGENARBEIT, no housing stats', () => {
    render(<ActionDashboard {...BASE_PROPS} role="FREIWILLIGENARBEIT" upcomingEventsCount={2} />)
    const stats = screen.getAllByTestId('quick-stat')
    expect(stats).toHaveLength(2)
    expect(screen.queryByText(/Freie Plätze/)).not.toBeInTheDocument()
    expect(screen.getByText(/Veranstaltungen: 2/)).toBeInTheDocument()
  })

  it('hides check-in and maintenance stats for SOZIALARBEIT but keeps occupancy', () => {
    render(<ActionDashboard {...BASE_PROPS} role="SOZIALARBEIT" />)
    expect(screen.queryByText(/Check-ins:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Wartung:/)).not.toBeInTheDocument()
    expect(screen.getByText(/Freie Plätze: 10/)).toBeInTheDocument()
  })

  it('shows correct freeBeds in the free-beds stat', () => {
    render(<ActionDashboard {...BASE_PROPS} occupiedBeds={8} totalBeds={20} />)
    expect(screen.getByText(/Freie Plätze: 12/)).toBeInTheDocument()
  })

  it('shows overdue check-in count in stat', () => {
    render(<ActionDashboard {...BASE_PROPS} overdueCheckIns={[makeCheckIn('c1'), makeCheckIn('c2')]} />)
    expect(screen.getByText(/Check-ins: 2/)).toBeInTheDocument()
  })

  it('shows conflict-free days in harmony stat', () => {
    render(<ActionDashboard {...BASE_PROPS} conflictFreeDays={7} />)
    expect(screen.getByText(/Harmonie: 7/)).toBeInTheDocument()
  })

  it('shows open maintenance count in stat', () => {
    render(<ActionDashboard {...BASE_PROPS} openMaintenanceCount={5} />)
    expect(screen.getByText(/Wartung: 5/)).toBeInTheDocument()
  })

  // ── Action tiles section ──────────────────────────────────────────────────

  it('hides open-tasks section when no issues and no problem units', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.queryByText('Offene Aufgaben')).not.toBeInTheDocument()
  })

  it('shows open-tasks section when overdueCheckIns present', () => {
    render(<ActionDashboard {...BASE_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.getByText('Offene Aufgaben')).toBeInTheDocument()
  })

  it('renders check-in ActionTile when overdueCheckIns present', () => {
    render(<ActionDashboard {...BASE_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Check-ins durchführen (1)')
  })

  it('renders unplaced-residents ActionTile when unplacedResidents present', () => {
    render(<ActionDashboard {...BASE_PROPS} unplacedResidents={[makeResident('r1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Bewohner platzieren (1)')
  })

  it('renders problem-units ActionTile when problemUnits present', () => {
    render(<ActionDashboard {...BASE_PROPS} problemUnits={[makeProblemUnit('1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Einheiten mit Konflikten (1)')
  })

  it('shows open-tasks section when only problemUnits present', () => {
    render(<ActionDashboard {...BASE_PROPS} problemUnits={[makeProblemUnit('1')]} />)
    expect(screen.getByText('Offene Aufgaben')).toBeInTheDocument()
  })

  it('renders transfer-requests ActionTile and counts it as a waiting task', () => {
    render(<ActionDashboard {...BASE_PROPS} pendingTransfers={[makeTransfer('t1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Verlegungsanfragen prüfen (1)')
    expect(screen.getByText('1 Aufgabe wartet auf Sie.')).toBeInTheDocument()
  })

  it('renders proposals ActionTile and counts it as a waiting task', () => {
    render(<ActionDashboard {...BASE_PROPS} proposalsAwaitingStaff={[makeProposal('p1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Beschlüsse bestätigen (1)')
    expect(screen.getByText('1 Aufgabe wartet auf Sie.')).toBeInTheDocument()
  })

  // ── Due-soon section ──────────────────────────────────────────────────────

  it('hides due-soon section when no dueSoonCheckIns', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.queryByText('Bald fällig')).not.toBeInTheDocument()
  })

  it('shows due-soon section when dueSoonCheckIns present', () => {
    render(<ActionDashboard {...BASE_PROPS} dueSoonCheckIns={[makeDueSoon('d1')]} />)
    expect(screen.getByText('Bald fällig')).toBeInTheDocument()
  })

  it('renders check-ins-this-week ActionTile in due-soon section', () => {
    render(<ActionDashboard {...BASE_PROPS} dueSoonCheckIns={[makeDueSoon('d1')]} />)
    expect(screen.getByTestId('action-tile')).toHaveTextContent('Check-ins diese Woche (1)')
  })

  // ── All-clear state ───────────────────────────────────────────────────────

  it('shows AllClearState when no issues, no incidents, no problem units', () => {
    render(<ActionDashboard {...BASE_PROPS} />)
    expect(screen.getByTestId('all-clear-state')).toBeInTheDocument()
  })

  it('hides AllClearState when there are overdue check-ins', () => {
    render(<ActionDashboard {...BASE_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.queryByTestId('all-clear-state')).not.toBeInTheDocument()
  })

  it('hides AllClearState when there are critical incidents', () => {
    render(<ActionDashboard {...BASE_PROPS} criticalIncidents={[makeIncident('i1')]} />)
    expect(screen.queryByTestId('all-clear-state')).not.toBeInTheDocument()
  })

  it('hides AllClearState when problem units exist', () => {
    render(<ActionDashboard {...BASE_PROPS} problemUnits={[makeProblemUnit('1')]} />)
    expect(screen.queryByTestId('all-clear-state')).not.toBeInTheDocument()
  })
})
