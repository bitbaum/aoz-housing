import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { OccupancyCard } from '../OccupancyCard'

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
    sectionOccupancy: 'Belegung',
    sectionHousing: 'Unterkünfte',
    occupancyOccupied: 'belegt',
    occupancyOf: 'von',
    occupancyPlaces: 'Plätzen',
    occupancyFree: 'frei',
    occupancyAvailable: 'Verfügbar',
    occupancyFull: 'Voll belegt',
    occupancyMaintenance: 'In Wartung',
    occupancyClosed: 'Geschlossen',
    occupancyViewAll: 'Alle Unterkünfte',
  },
}))

vi.mock('@/lib/config/thresholds', async () => ({
  getOccupancyLevel: (percent: number) => {
    if (percent >= 90) return 'critical'
    if (percent >= 70) return 'warning'
    return 'healthy'
  },
  OCCUPANCY_COLORS: {
    critical: 'bg-status-error',
    warning: 'bg-status-warning',
    healthy: 'bg-status-success',
  },
}))

// --- Helpers ---

const BASE_UNIT_STATUS = { available: 3, full: 1, maintenance: 0, closed: 0 }

function renderCard(occupiedBeds: number, totalBeds: number, unitStatus = BASE_UNIT_STATUS) {
  return render(
    <OccupancyCard occupiedBeds={occupiedBeds} totalBeds={totalBeds} unitStatus={unitStatus} />,
  )
}

// --- Tests ---

describe('OccupancyCard', () => {
  // ── Occupancy percentage ──────────────────────────────────────────────────

  it('shows 0% when no beds exist', () => {
    renderCard(0, 0)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('calculates and displays the occupancy percentage correctly', () => {
    renderCard(7, 10)
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('rounds occupancy percentage to nearest integer', () => {
    renderCard(1, 3) // 33.33...%
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  // ── Free bed count text ───────────────────────────────────────────────────

  it('shows occupied, total, and free bed counts', () => {
    renderCard(6, 10)
    expect(screen.getByText(/6 von 10 Plätzen/)).toBeInTheDocument()
    expect(screen.getByText(/4 frei/)).toBeInTheDocument()
  })

  // ── Colour class by occupancy level ──────────────────────────────────────

  it('applies healthy colour class when occupancy < 70%', () => {
    const { container } = renderCard(5, 10) // 50%
    const bar = container.querySelector('.bg-status-success')
    expect(bar).toBeInTheDocument()
  })

  it('applies warning colour class when occupancy is 70–89%', () => {
    const { container } = renderCard(7, 10) // 70%
    const bar = container.querySelector('.bg-status-warning')
    expect(bar).toBeInTheDocument()
  })

  it('applies critical colour class when occupancy ≥ 90%', () => {
    const { container } = renderCard(9, 10) // 90%
    const bar = container.querySelector('.bg-status-error')
    expect(bar).toBeInTheDocument()
  })

  // ── Section heading ───────────────────────────────────────────────────────

  it('renders the section heading', () => {
    renderCard(0, 10)
    expect(screen.getByRole('heading', { name: 'Belegung' })).toBeInTheDocument()
  })

  // ── Unit status rows ──────────────────────────────────────────────────────

  it('shows available, full, and maintenance row counts', () => {
    renderCard(5, 10, { available: 4, full: 2, maintenance: 1, closed: 0 })
    expect(screen.getByRole('link', { name: /Verfügbar.*4/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voll belegt.*2/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /In Wartung.*1/ })).toBeInTheDocument()
  })

  it('hides the closed row when closed count is 0', () => {
    renderCard(5, 10, { available: 3, full: 1, maintenance: 0, closed: 0 })
    expect(screen.queryByText('Geschlossen')).not.toBeInTheDocument()
  })

  it('shows the closed row when closed count > 0', () => {
    renderCard(5, 10, { available: 2, full: 1, maintenance: 0, closed: 2 })
    expect(screen.getByRole('link', { name: /Geschlossen.*2/ })).toBeInTheDocument()
  })

  // ── Links ─────────────────────────────────────────────────────────────────

  it('links the occupancy bar to /housing', () => {
    renderCard(5, 10)
    const links = screen.getAllByRole('link', { name: /60%|belegt/ })
    const housingLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href') === '/housing')
    expect(housingLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('links "Alle Unterkünfte" to /housing', () => {
    renderCard(5, 10)
    expect(screen.getByRole('link', { name: /Alle Unterkünfte/ })).toHaveAttribute(
      'href',
      '/housing',
    )
  })

  it('links the available status row to /housing?status=AVAILABLE', () => {
    renderCard(5, 10)
    expect(screen.getByRole('link', { name: /Verfügbar/ })).toHaveAttribute(
      'href',
      '/housing?status=AVAILABLE',
    )
  })
})
