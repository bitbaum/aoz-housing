import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { ResidentsList, type ResidentListItem } from '../ResidentsList'

// --- Mocks ---

vi.mock('next/link', () => ({
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

vi.mock('@/components/residents/ResidentCardActions', () => ({
  ResidentCardActions: ({ residentId }: { residentId: string }) => (
    <div data-testid={`actions-${residentId}`} />
  ),
}))

vi.mock('@/lib/constants', () => ({
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

vi.mock('@/lib/utils', () => ({
  getStatusBadgeClass: (status: string) => `badge-${status.toLowerCase()}`,
  formatDate: (d: Date | string) => '01.01.2024',
}))

// --- Helpers ---

function makeResident(overrides: Partial<ResidentListItem> & { id: string }): ResidentListItem {
  return {
    id: overrides.id,
    code: overrides.code ?? `RES-${overrides.id}`,
    displayName: overrides.displayName ?? null,
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

  // ── Card rendering ────────────────────────────────────────────────────────

  it('renders resident code', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', code: 'RES-001' })]} />)
    expect(screen.getByText('RES-001')).toBeInTheDocument()
  })

  it('renders link to resident profile', () => {
    render(<ResidentsList residents={[makeResident({ id: 'res-abc', code: 'RES-ABC' })]} />)
    expect(screen.getByRole('link', { name: /RES-ABC/ })).toHaveAttribute(
      'href',
      '/residents/res-abc',
    )
  })

  it('shows age and gender', () => {
    render(
      <ResidentsList residents={[makeResident({ id: 'r1', ageRange: 'ADULT', gender: 'MALE' })]} />,
    )
    expect(screen.getByText(/26-40/)).toBeInTheDocument()
    expect(screen.getByText(/M/)).toBeInTheDocument()
  })

  it('shows status badge', () => {
    render(<ResidentsList residents={[makeResident({ id: 'r1', status: 'PLACED' })]} />)
    expect(screen.getByText('Platziert')).toBeInTheDocument()
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
    render(
      <ResidentsList
        residents={[
          makeResident({ id: 'r1', code: 'RES-001' }),
          makeResident({ id: 'r2', code: 'RES-002' }),
        ]}
      />,
    )
    expect(screen.getByText('RES-001')).toBeInTheDocument()
    expect(screen.getByText('RES-002')).toBeInTheDocument()
  })
})
