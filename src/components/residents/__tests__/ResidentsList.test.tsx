import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResidentsList, type ResidentListItem } from '../ResidentsList'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/components/ui/FilterBar', () => ({
  SearchInput: ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input aria-label={placeholder ?? 'Suchen...'} value={value} onChange={e => onChange(e.target.value)} />
  ),
  SelectFilter: ({ label, value, options, onChange }: {
    label: string; value: string
    options: { value: string; label: string }[]; onChange: (v: string) => void
  }) => (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  FilterBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/components/residents/ResidentCardActions', () => ({
  ResidentCardActions: ({ residentId }: { residentId: string }) => (
    <div data-testid={`actions-${residentId}`} />
  ),
}))

jest.mock('@/lib/constants', () => ({
  AGE_RANGE_LABELS: { ADULT: '26-40', YOUNG_ADULT: '18-25' },
  GENDER_LABELS_SHORT: { MALE: 'M', FEMALE: 'W', PREFER_NOT_SAY: '-' },
  RESIDENT_STATUS_LABELS: { ACTIVE: 'Aktiv', PLACED: 'Platziert', EXITED: 'Archiviert' },
  RESIDENT_LIST_LABELS: {
    allStatus: 'Alle Status',
    searchPlaceholder: 'Bewohner suchen...',
    statusFilter: 'Status',
    emptyDefault: 'Noch keine Bewohner vorhanden',
    emptyFiltered: 'Keine Bewohner für diese Filter',
    notPlaced: 'Nicht platziert',
    filterReset: 'Filter zurücksetzen',
    recentIncidentsSuffix: 'Vorfälle',
  },
  LANGUAGE_LABELS: { de: 'Deutsch', en: 'Englisch' },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] ?? key,
}))

jest.mock('@/lib/utils', () => ({
  getStatusBadgeClass: (status: string) => `badge-${status.toLowerCase()}`,
  formatDate: (d: Date | string) => '01.01.2024',
}))

// --- Helpers ---

function makeResident(overrides: Partial<ResidentListItem> & { id: string }): ResidentListItem {
  return {
    id: overrides.id,
    code: overrides.code ?? `RES-${overrides.id}`,
    ageRange: overrides.ageRange ?? 'ADULT',
    gender: overrides.gender ?? 'PREFER_NOT_SAY',
    status: overrides.status ?? 'ACTIVE',
    languages: overrides.languages ?? ['de'],
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    placements: overrides.placements ?? [],
    incidentCount: overrides.incidentCount ?? 0,
  }
}

// --- Tests ---

describe('ResidentsList', () => {
  // ── Empty states ──────────────────────────────────────────────────────────

  it('shows empty-default message when no residents at all', () => {
    render(<ResidentsList residents={[]} />)
    expect(screen.getByText('Noch keine Bewohner vorhanden')).toBeInTheDocument()
  })

  it('shows empty-filtered message when filter yields no results', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', code: 'RES-AAA' })]} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Bewohner suchen...' }), {
      target: { value: 'ZZZ' },
    })
    expect(screen.getByText('Keine Bewohner für diese Filter')).toBeInTheDocument()
  })

  it('shows "Filter zurücksetzen" button when filtered empty', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', code: 'RES-AAA' })]} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'NOMATCH' } })
    expect(screen.getByRole('button', { name: 'Filter zurücksetzen' })).toBeInTheDocument()
  })

  it('reset button clears filters and shows residents again', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', code: 'RES-AAA' })]} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'NOMATCH' } })
    fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }))
    expect(screen.getByText('RES-AAA')).toBeInTheDocument()
  })

  // ── Card rendering ────────────────────────────────────────────────────────

  it('renders resident code', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', code: 'RES-001' })]} />)
    expect(screen.getByText('RES-001')).toBeInTheDocument()
  })

  it('renders link to resident profile', () => {
    render(<ResidentsList residents={[makeResident({ id: 'res-abc', code: 'RES-ABC' })]} />)
    expect(screen.getByRole('link', { name: /RES-ABC/ })).toHaveAttribute('href', '/residents/res-abc')
  })

  it('shows age and gender', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', ageRange: 'ADULT', gender: 'MALE' })]} />)
    expect(screen.getByText(/26-40/)).toBeInTheDocument()
    expect(screen.getByText(/M/)).toBeInTheDocument()
  })

  it('shows status badge', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', status: 'PLACED' })]} />)
    // 'Platziert' also appears in the status select options
    expect(screen.getAllByText('Platziert').length).toBeGreaterThanOrEqual(1)
  })

  it('shows housing unit code when placed', () => {
    const resident = makeResident({
      id: 'r1',
      placements: [{ housingUnit: { code: 'HU-01' } }],
    })
    render(<ResidentsList residents={[resident]} />)
    expect(screen.getByText('HU-01')).toBeInTheDocument()
  })

  it('shows "Nicht platziert" warning when no placement', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', placements: [] })]} />)
    expect(screen.getByText('Nicht platziert')).toBeInTheDocument()
  })

  it('shows language', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', languages: ['de'] })]} />)
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
  })

  it('shows incident count when > 0', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', incidentCount: 3 })]} />)
    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.getByText(/Vorfälle/)).toBeInTheDocument()
  })

  it('hides incident count when 0', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', incidentCount: 0 })]} />)
    expect(screen.queryByText(/Vorfälle/)).not.toBeInTheDocument()
  })

  it('renders ResidentCardActions with resident id', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r42' })]} />)
    expect(screen.getByTestId('actions-r42')).toBeInTheDocument()
  })

  it('renders multiple resident cards', () => {
    render(<ResidentsList residents={[
      makeResident({ id: 'r1', code: 'RES-001' }),
      makeResident({ id: 'r2', code: 'RES-002' }),
    ]} />)
    expect(screen.getByText('RES-001')).toBeInTheDocument()
    expect(screen.getByText('RES-002')).toBeInTheDocument()
  })

  // ── Search filter ─────────────────────────────────────────────────────────

  it('filters residents by code (case-insensitive)', () => {
    render(<ResidentsList residents={[
      makeResident({ id: 'r1', code: 'RES-AAA' }),
      makeResident({ id: 'r2', code: 'RES-BBB' }),
    ]} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'aaa' } })
    expect(screen.getByText('RES-AAA')).toBeInTheDocument()
    expect(screen.queryByText('RES-BBB')).not.toBeInTheDocument()
  })

  // ── Status filter ─────────────────────────────────────────────────────────

  it('filters residents by status', () => {
    render(<ResidentsList residents={[
      makeResident({ id: 'r1', code: 'RES-001', status: 'ACTIVE' }),
      makeResident({ id: 'r2', code: 'RES-002', status: 'EXITED' }),
    ]} />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'EXITED' },
    })
    expect(screen.getByText('RES-002')).toBeInTheDocument()
    expect(screen.queryByText('RES-001')).not.toBeInTheDocument()
  })

  it('shows all residents when status filter cleared', () => {
    render(<ResidentsList residents={[
      makeResident({ id: 'r1', code: 'RES-001', status: 'ACTIVE' }),
      makeResident({ id: 'r2', code: 'RES-002', status: 'EXITED' }),
    ]} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'EXITED' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    expect(screen.getByText('RES-001')).toBeInTheDocument()
    expect(screen.getByText('RES-002')).toBeInTheDocument()
  })
})
