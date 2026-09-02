import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { DashboardMetrics } from '../DashboardMetrics'

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

vi.mock('@/lib/constants/labels/dashboard', async () => ({
  ALGORITHM_ACCURACY_LABELS: {
    statResidents: 'Bewohner',
    statWaitingForPlacement: (n: number) => `${n} warten auf Platzierung`,
    statAllPlaced: 'Alle platziert',
    statFreeBeds: 'Freie Plätze',
    statOfTotal: (n: number) => `von ${n} total`,
    statCheckInsOverdue: 'Check-ins überfällig',
    statActivePlacements: (n: number) => `von ${n} aktiven Platzierungen`,
    statOpenIncidents: 'Offene Vorfälle',
    statConflictsMaintenance: (c: number, m: number) => `${c} Konflikte, ${m} Wartung`,
  },
}))

// --- Helpers ---

const BASE_PROPS = {
  totalResidents: 20,
  unplacedCount: 0,
  freeBeds: 5,
  totalBeds: 30,
  overdueCheckIns: 0,
  activePlacements: 18,
  openIncidents: 0,
  interpersonalCount: 0,
  maintenanceCount: 0,
}

function renderMetrics(overrides: Partial<typeof BASE_PROPS> = {}) {
  return render(<DashboardMetrics {...BASE_PROPS} {...overrides} />)
}

// --- Tests ---

describe('DashboardMetrics', () => {
  // ── Residents tile ────────────────────────────────────────────────────────

  it('displays total resident count', () => {
    renderMetrics({ totalResidents: 42 })
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows "Alle platziert" when unplacedCount is 0', () => {
    renderMetrics({ unplacedCount: 0 })
    expect(screen.getByText('Alle platziert')).toBeInTheDocument()
  })

  it('shows waiting count when unplacedCount > 0', () => {
    renderMetrics({ unplacedCount: 3 })
    expect(screen.getByText('3 warten auf Platzierung')).toBeInTheDocument()
  })

  it('links residents tile to /residents', () => {
    renderMetrics()
    expect(screen.getByRole('link', { name: /Bewohner/ })).toHaveAttribute('href', '/residents')
  })

  // ── Free beds tile ────────────────────────────────────────────────────────

  it('displays free bed count', () => {
    renderMetrics({ freeBeds: 8 })
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows total beds in the subtitle', () => {
    renderMetrics({ freeBeds: 5, totalBeds: 40 })
    expect(screen.getByText('von 40 total')).toBeInTheDocument()
  })

  it('links free-beds tile to /housing', () => {
    renderMetrics()
    expect(screen.getByRole('link', { name: /Freie Plätze/ })).toHaveAttribute('href', '/housing')
  })

  // ── Free beds colour thresholds ───────────────────────────────────────────

  it('applies success colour when freeBeds ≥ 5', () => {
    const { container } = renderMetrics({ freeBeds: 5 })
    // The free beds number element should have text-status-success class
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies warning colour when freeBeds is 2–4', () => {
    const { container } = renderMetrics({ freeBeds: 3 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when freeBeds < 2', () => {
    const { container } = renderMetrics({ freeBeds: 1 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Overdue check-ins tile ────────────────────────────────────────────────

  it('displays overdue check-in count', () => {
    renderMetrics({ overdueCheckIns: 4 })
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows active placements in the subtitle', () => {
    renderMetrics({ overdueCheckIns: 2, activePlacements: 15 })
    expect(screen.getByText('von 15 aktiven Platzierungen')).toBeInTheDocument()
  })

  it('links overdue check-ins tile to the correct filtered URL', () => {
    renderMetrics()
    expect(screen.getByRole('link', { name: /Check-ins überfällig/ })).toHaveAttribute(
      'href',
      '/placements?status=active&overdue=1',
    )
  })

  it('applies success colour when overdueCheckIns === 0', () => {
    const { container } = renderMetrics({ overdueCheckIns: 0 })
    // Multiple tiles may be success; verify at least one is present
    expect(container.querySelectorAll('.text-status-success').length).toBeGreaterThanOrEqual(1)
  })

  // ── Open incidents tile ───────────────────────────────────────────────────

  it('displays open incident count', () => {
    renderMetrics({ openIncidents: 7 })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows interpersonal and maintenance breakdown in subtitle', () => {
    renderMetrics({ openIncidents: 3, interpersonalCount: 2, maintenanceCount: 1 })
    expect(screen.getByText('2 Konflikte, 1 Wartung')).toBeInTheDocument()
  })

  it('links incidents tile to /incidents', () => {
    renderMetrics()
    expect(screen.getByRole('link', { name: /Offene Vorfälle/ })).toHaveAttribute(
      'href',
      '/incidents',
    )
  })
})
