import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { HousingList, HousingListItem } from '../HousingList'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/components/housing/HousingCardActions', () => ({
  HousingCardActions: ({ housingId, status }: { housingId: string; status: string }) => (
    <div data-testid={`actions-${housingId}`} data-status={status} />
  ),
}))

jest.mock('@/lib/utils', () => ({
  getOccupancyColorClass: (percent: number) =>
    percent >= 90 ? 'bg-status-error' : percent >= 70 ? 'bg-status-warning' : 'bg-status-success',
}))

jest.mock('@/lib/constants/labels/housing', () => ({
  HOUSING_STATUS_LABELS: {
    AVAILABLE: 'Verfügbar',
    FULL: 'Voll belegt',
    MAINTENANCE: 'In Wartung',
    CLOSED: 'Geschlossen',
  },
}))

jest.mock('@/lib/constants', () => ({
  HOUSING_LIST_LABELS: {
    searchPlaceholder: 'Unterkunft suchen...',
    statusFilter: 'Status',
    allStatus: 'Alle Status',
    emptyDefault: 'Noch keine Unterkünfte vorhanden',
    emptyFiltered: 'Keine Unterkünfte für diese Filter',
    filterReset: 'Filter zurücksetzen',
    createHousingFirst: 'Erste Unterkunft erfassen',
    occupancy: 'Belegung',
    wheelchairTitle: 'Rollstuhlgerecht',
  },
}))

jest.mock('@/lib/constants/labels', () => ({
  HOUSING_LIST_LABELS: {
    searchPlaceholder: 'Unterkunft suchen...',
    statusFilter: 'Status',
    allStatus: 'Alle Status',
    emptyDefault: 'Noch keine Unterkünfte vorhanden',
    emptyFiltered: 'Keine Unterkünfte für diese Filter',
    filterReset: 'Filter zurücksetzen',
    createHousingFirst: 'Erste Unterkunft erfassen',
    occupancy: 'Belegung',
    wheelchairTitle: 'Rollstuhlgerecht',
  },
}))

// --- Tests for the resident-chosen name ---

describe('the name residents gave their home', () => {
  it('shows it alongside the code once they have chosen one', () => {
    render(<HousingList units={[makeUnit({ id: '1', code: 'U05', nickname: 'Casa Harmonie' })]} />)
    expect(screen.getByText('Casa Harmonie (U05)')).toBeInTheDocument()
  })

  it('shows the bare code when they have not', () => {
    // No empty brackets, and no invented name.
    render(<HousingList units={[makeUnit({ id: '1', code: 'U05', nickname: null })]} />)
    expect(screen.getByText('U05')).toBeInTheDocument()
  })
})

// --- Helpers ---

function makeUnit(overrides: Partial<HousingListItem> & { id: string }): HousingListItem {
  return {
    id: overrides.id,
    code: overrides.code ?? `UNIT-${overrides.id}`,
    nickname: overrides.nickname ?? null,
    address: overrides.address ?? 'Musterstrasse 1',
    status: overrides.status ?? 'AVAILABLE',
    totalBeds: overrides.totalBeds ?? 4,
    totalRooms: overrides.totalRooms ?? 2,
    wheelchairAccess: overrides.wheelchairAccess ?? false,
    placementCount: overrides.placementCount ?? 2,
    incidentCount: overrides.incidentCount ?? 0,
  }
}

// --- Tests ---

describe('HousingList', () => {
  // ── Empty states ──────────────────────────────────────────────────────────

  it('shows default empty message when no units exist', () => {
    render(<HousingList units={[]} />)
    expect(screen.getByText('Noch keine Unterkünfte vorhanden')).toBeInTheDocument()
  })

  // ── Unit card rendering ───────────────────────────────────────────────────

  it('renders each unit card with code and address', () => {
    const units = [makeUnit({ id: 'u1', code: 'A01', address: 'Bahnhofstr. 5' })]
    render(<HousingList units={units} />)
    expect(screen.getByText('A01')).toBeInTheDocument()
    expect(screen.getByText('Bahnhofstr. 5')).toBeInTheDocument()
  })

  it('links each unit card to /housing/<id>', () => {
    const units = [makeUnit({ id: 'unit-42', code: 'B02' })]
    render(<HousingList units={units} />)
    expect(screen.getByRole('link', { name: /B02/ })).toHaveAttribute('href', '/housing/unit-42')
  })

  it('renders the status badge with correct label', () => {
    const units = [makeUnit({ id: 'u1', status: 'MAINTENANCE' })]
    render(<HousingList units={units} />)
    expect(screen.getByText('In Wartung')).toBeInTheDocument()
  })

  it('shows room count', () => {
    const units = [makeUnit({ id: 'u1', totalRooms: 3 })]
    render(<HousingList units={units} />)
    expect(screen.getByText(/3 Zimmer/)).toBeInTheDocument()
  })

  it('shows wheelchair icon when wheelchairAccess is true', () => {
    const units = [makeUnit({ id: 'u1', wheelchairAccess: true })]
    render(<HousingList units={units} />)
    expect(screen.getByText('Barrierefrei')).toBeInTheDocument()
  })

  it('hides wheelchair icon when wheelchairAccess is false', () => {
    const units = [makeUnit({ id: 'u1', wheelchairAccess: false })]
    render(<HousingList units={units} />)
    expect(screen.queryByText('Barrierefrei')).not.toBeInTheDocument()
  })

  it('shows occupancy as placementCount/totalBeds', () => {
    const units = [makeUnit({ id: 'u1', placementCount: 3, totalBeds: 5 })]
    render(<HousingList units={units} />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('renders HousingCardActions for each unit with correct props', () => {
    const units = [makeUnit({ id: 'unit-7', status: 'FULL' })]
    render(<HousingList units={units} />)
    const actions = screen.getByTestId('actions-unit-7')
    expect(actions).toBeInTheDocument()
    expect(actions).toHaveAttribute('data-status', 'FULL')
  })

  // ── Conflict indicator ────────────────────────────────────────────────────

  it('shows conflict count when incidentCount > 0', () => {
    const units = [makeUnit({ id: 'u1', incidentCount: 3 })]
    render(<HousingList units={units} />)
    expect(screen.getByText(/3 Konflikte/)).toBeInTheDocument()
  })

  it('hides conflict text when incidentCount === 0', () => {
    const units = [makeUnit({ id: 'u1', incidentCount: 0 })]
    render(<HousingList units={units} />)
    expect(screen.queryByText(/Konflikte/)).not.toBeInTheDocument()
  })

  it('applies success harmony colour when incidentCount === 0', () => {
    const { container } = render(<HousingList units={[makeUnit({ id: 'u1', incidentCount: 0 })]} />)
    expect(container.querySelector('.bg-status-success')).toBeInTheDocument()
  })

})
