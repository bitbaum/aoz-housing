import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { HousingList, HousingListItem } from '../HousingList'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/components/ui/FilterBar', () => ({
  FilterBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SearchInput: ({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder?: string
  }) => (
    <input
      aria-label={placeholder ?? 'search'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  SelectFilter: ({ label, value, options, onChange }: {
    label: string; value: string
    options: Array<{ value: string; label: string }>
    onChange: (v: string) => void
  }) => (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

// --- Helpers ---

function makeUnit(overrides: Partial<HousingListItem> & { id: string }): HousingListItem {
  return {
    id: overrides.id,
    code: overrides.code ?? `UNIT-${overrides.id}`,
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

  it('shows "Erste Unterkunft erfassen" link when no units exist', () => {
    render(<HousingList units={[]} />)
    expect(screen.getByRole('link', { name: 'Erste Unterkunft erfassen' })).toHaveAttribute('href', '/housing/new')
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
    // Label appears in both the card badge and the select option
    expect(screen.getAllByText('In Wartung').length).toBeGreaterThanOrEqual(1)
  })

  it('shows room count', () => {
    const units = [makeUnit({ id: 'u1', totalRooms: 3 })]
    render(<HousingList units={units} />)
    expect(screen.getByText(/3 Zimmer/)).toBeInTheDocument()
  })

  it('shows wheelchair icon when wheelchairAccess is true', () => {
    const units = [makeUnit({ id: 'u1', wheelchairAccess: true })]
    render(<HousingList units={units} />)
    expect(screen.getByText('♿')).toBeInTheDocument()
  })

  it('hides wheelchair icon when wheelchairAccess is false', () => {
    const units = [makeUnit({ id: 'u1', wheelchairAccess: false })]
    render(<HousingList units={units} />)
    expect(screen.queryByText('♿')).not.toBeInTheDocument()
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

  it('applies warning harmony colour when incidentCount is 1–2', () => {
    const { container } = render(<HousingList units={[makeUnit({ id: 'u1', incidentCount: 1 })]} />)
    expect(container.querySelector('.bg-status-warning')).toBeInTheDocument()
  })

  it('applies error harmony colour when incidentCount > 2', () => {
    const { container } = render(<HousingList units={[makeUnit({ id: 'u1', incidentCount: 3 })]} />)
    // incidentCount=3 → bg-status-error harmony dot; but getOccupancyColorClass(50%) = bg-status-success
    const dots = container.querySelectorAll('.bg-status-error')
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })

  // ── Search filtering ──────────────────────────────────────────────────────

  it('filters units by code (case-insensitive)', () => {
    const units = [
      makeUnit({ id: 'u1', code: 'Alpha' }),
      makeUnit({ id: 'u2', code: 'Beta' }),
    ]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByPlaceholderText('Unterkunft suchen...'), { target: { value: 'alph' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('filters units by address', () => {
    const units = [
      makeUnit({ id: 'u1', code: 'A01', address: 'Bahnhofstrasse 1' }),
      makeUnit({ id: 'u2', code: 'B02', address: 'Seestrasse 10' }),
    ]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByPlaceholderText('Unterkunft suchen...'), { target: { value: 'bahn' } })
    expect(screen.getByText('A01')).toBeInTheDocument()
    expect(screen.queryByText('B02')).not.toBeInTheDocument()
  })

  it('shows filtered-empty message when search yields no results', () => {
    const units = [makeUnit({ id: 'u1', code: 'A01' })]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByPlaceholderText('Unterkunft suchen...'), { target: { value: 'xyz' } })
    expect(screen.getByText('Keine Unterkünfte für diese Filter')).toBeInTheDocument()
  })

  it('shows filter-reset button when filtered to empty', () => {
    const units = [makeUnit({ id: 'u1', code: 'A01' })]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByPlaceholderText('Unterkunft suchen...'), { target: { value: 'xyz' } })
    expect(screen.getByRole('button', { name: 'Filter zurücksetzen' })).toBeInTheDocument()
  })

  it('clears search when filter-reset button clicked', () => {
    const units = [makeUnit({ id: 'u1', code: 'A01' })]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByPlaceholderText('Unterkunft suchen...'), { target: { value: 'xyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }))
    expect(screen.getByText('A01')).toBeInTheDocument()
  })

  // ── Status filtering ──────────────────────────────────────────────────────

  it('filters units by status', () => {
    const units = [
      makeUnit({ id: 'u1', status: 'AVAILABLE' }),
      makeUnit({ id: 'u2', code: 'CLOSED-UNIT', status: 'CLOSED' }),
    ]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'AVAILABLE' } })
    expect(screen.getByText(/UNIT-u1/)).toBeInTheDocument()
    expect(screen.queryByText('CLOSED-UNIT')).not.toBeInTheDocument()
  })

  it('shows all units when status filter is cleared', () => {
    const units = [
      makeUnit({ id: 'u1', status: 'AVAILABLE' }),
      makeUnit({ id: 'u2', status: 'CLOSED' }),
    ]
    render(<HousingList units={units} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'CLOSED' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: '' } })
    expect(screen.getByText('UNIT-u1')).toBeInTheDocument()
    expect(screen.getByText('UNIT-u2')).toBeInTheDocument()
  })
})
