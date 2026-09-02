import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { TaskSection } from '../TaskSection'

// --- Mocks ---

vi.mock('next/link', async () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/constants/labels', async () => ({
  DASHBOARD_LABELS: {
    sectionTasks: 'Aufgaben',
    allClearAllDone: 'Alles erledigt!',
    showAllLink: 'Alle',
    showMoreSuffix: 'weitere',
    daysAgo: 'Tagen',
    taskCriticalOpenSuffix: 'kritische Vorfälle offen',
    taskNoCritical: 'Keine kritischen Vorfälle',
    taskCheckInsOverdueSuffix: 'Check-ins überfällig',
    taskAllCheckInsCurrent: 'Alle Check-ins aktuell',
    taskWaitingPlacementSuffix: 'Bewohner warten auf Platzierung',
    taskAllPlaced: 'Alle Bewohner platziert',
    taskMaintenanceOverdueSuffix: 'Wartungstickets überfällig',
    taskMaintenanceCurrent: 'Wartung aktuell',
    taskWeek: 'Woche',
    taskDaysAgoPrefix: 'Vor',
    taskSincePrefix: 'Seit',
  },
}))

// --- Helpers ---

const EMPTY_PROPS = {
  overdueCheckIns: [],
  unplacedResidents: [],
  criticalIncidents: [],
  overdueMaintenance: [],
}

function makeIncident(id: string) {
  return { id, type: 'Konflikt', unitCode: 'A01', unitId: 'unit-1', daysSinceCreated: 3 }
}

function makeCheckIn(id: string) {
  return {
    id,
    residentCode: `RES-${id}`,
    residentId: `rid-${id}`,
    weekNumber: 12,
    unitCode: 'B02',
    unitId: `unit-${id}`,
    daysSinceLastCheckIn: 10,
    supportLevel: 'STANDARD',
  }
}

function makeResident(id: string) {
  return { id, code: `RES-${id}`, displayName: null, createdAt: new Date('2024-02-01') }
}

function makeMaintenance(id: string) {
  return { id, title: `Ticket ${id}`, unitCode: 'C03', daysSinceCreated: 7 }
}

// --- Tests ---

describe('TaskSection', () => {
  // ── Section heading ───────────────────────────────────────────────────────

  it('renders the section heading', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByRole('heading', { name: 'Aufgaben' })).toBeInTheDocument()
  })

  // ── All-clear state ───────────────────────────────────────────────────────

  it('shows "Alles erledigt!" when all lists are empty', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByText('Alles erledigt!')).toBeInTheDocument()
  })

  it('hides "Alles erledigt!" when any list has items', () => {
    render(<TaskSection {...EMPTY_PROPS} criticalIncidents={[makeIncident('i1')]} />)
    expect(screen.queryByText('Alles erledigt!')).not.toBeInTheDocument()
  })

  // ── Critical incidents ────────────────────────────────────────────────────

  it('shows critical incident count and suffix when present', () => {
    render(
      <TaskSection {...EMPTY_PROPS} criticalIncidents={[makeIncident('i1'), makeIncident('i2')]} />,
    )
    expect(screen.getByText(/2 kritische Vorfälle offen/)).toBeInTheDocument()
  })

  it('shows "Keine kritischen Vorfälle" when list is empty', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByText('Keine kritischen Vorfälle')).toBeInTheDocument()
  })

  it('renders each critical incident as a link to /incidents/<id>', () => {
    render(<TaskSection {...EMPTY_PROPS} criticalIncidents={[makeIncident('inc-1')]} />)
    expect(screen.getByRole('link', { name: /Konflikt/ })).toHaveAttribute(
      'href',
      '/incidents/inc-1',
    )
  })

  it('links the critical category header to /incidents?severity=CRITICAL', () => {
    render(<TaskSection {...EMPTY_PROPS} criticalIncidents={[makeIncident('i1')]} />)
    const links = screen.getAllByRole('link')
    const headerLink = links.find(
      (l) =>
        l.getAttribute('href') === '/incidents?severity=CRITICAL&resolved=false' &&
        l.textContent?.includes('Alle'),
    )
    expect(headerLink).toBeDefined()
  })

  it('shows "+N weitere" when more than 3 critical incidents', () => {
    const incidents = ['i1', 'i2', 'i3', 'i4'].map(makeIncident)
    render(<TaskSection {...EMPTY_PROPS} criticalIncidents={incidents} />)
    expect(screen.getByText(/\+ 1 weitere/)).toBeInTheDocument()
  })

  it('does not show "+N weitere" when 3 or fewer critical incidents', () => {
    const incidents = ['i1', 'i2', 'i3'].map(makeIncident)
    render(<TaskSection {...EMPTY_PROPS} criticalIncidents={incidents} />)
    expect(screen.queryByText(/weitere/)).not.toBeInTheDocument()
  })

  // ── Overdue check-ins ─────────────────────────────────────────────────────

  it('shows overdue check-in count and suffix when present', () => {
    render(<TaskSection {...EMPTY_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.getByText(/1 Check-ins überfällig/)).toBeInTheDocument()
  })

  it('shows "Alle Check-ins aktuell" when list is empty', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByText('Alle Check-ins aktuell')).toBeInTheDocument()
  })

  it('renders each check-in as a link to /residents/<residentId>', () => {
    render(<TaskSection {...EMPTY_PROPS} overdueCheckIns={[makeCheckIn('c1')]} />)
    expect(screen.getByRole('link', { name: /RES-c1/ })).toHaveAttribute(
      'href',
      '/residents/rid-c1',
    )
  })

  it('shows "+N weitere" when more than 3 overdue check-ins', () => {
    const checkIns = ['c1', 'c2', 'c3', 'c4'].map(makeCheckIn)
    render(<TaskSection {...EMPTY_PROPS} overdueCheckIns={checkIns} />)
    expect(screen.getByText(/\+ 1 weitere/)).toBeInTheDocument()
  })

  // ── Unplaced residents ────────────────────────────────────────────────────

  it('shows unplaced resident count and suffix when present', () => {
    render(<TaskSection {...EMPTY_PROPS} unplacedResidents={[makeResident('r1')]} />)
    expect(screen.getByText(/1 Bewohner warten auf Platzierung/)).toBeInTheDocument()
  })

  it('shows "Alle Bewohner platziert" when list is empty', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByText('Alle Bewohner platziert')).toBeInTheDocument()
  })

  it('renders each unplaced resident as a link to /residents/<id>', () => {
    render(<TaskSection {...EMPTY_PROPS} unplacedResidents={[makeResident('r1')]} />)
    expect(screen.getByRole('link', { name: /RES-r1/ })).toHaveAttribute('href', '/residents/r1')
  })

  it('shows "+N weitere" when more than 3 unplaced residents', () => {
    const residents = ['r1', 'r2', 'r3', 'r4'].map(makeResident)
    render(<TaskSection {...EMPTY_PROPS} unplacedResidents={residents} />)
    expect(screen.getByText(/\+ 1 weitere/)).toBeInTheDocument()
  })

  // ── Overdue maintenance ───────────────────────────────────────────────────

  it('shows overdue maintenance count and suffix when present', () => {
    render(<TaskSection {...EMPTY_PROPS} overdueMaintenance={[makeMaintenance('m1')]} />)
    expect(screen.getByText(/1 Wartungstickets überfällig/)).toBeInTheDocument()
  })

  it('shows "Wartung aktuell" when list is empty', () => {
    render(<TaskSection {...EMPTY_PROPS} />)
    expect(screen.getByText('Wartung aktuell')).toBeInTheDocument()
  })

  it('renders each maintenance ticket as a link to /maintenance/<id>', () => {
    render(<TaskSection {...EMPTY_PROPS} overdueMaintenance={[makeMaintenance('m1')]} />)
    expect(screen.getByRole('link', { name: /Ticket m1/ })).toHaveAttribute(
      'href',
      '/maintenance/m1',
    )
  })

  it('links overdue maintenance header to /maintenance', () => {
    render(<TaskSection {...EMPTY_PROPS} overdueMaintenance={[makeMaintenance('m1')]} />)
    const links = screen.getAllByRole('link')
    const headerLink = links.find(
      (l) => l.getAttribute('href') === '/maintenance' && l.textContent?.includes('Alle'),
    )
    expect(headerLink).toBeDefined()
  })

  it('shows "+N weitere" when more than 3 overdue maintenance tickets', () => {
    const tickets = ['m1', 'm2', 'm3', 'm4'].map(makeMaintenance)
    render(<TaskSection {...EMPTY_PROPS} overdueMaintenance={tickets} />)
    expect(screen.getByText(/\+ 1 weitere/)).toBeInTheDocument()
  })
})
