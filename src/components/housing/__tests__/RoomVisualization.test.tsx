import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoomVisualization } from '../RoomVisualization'
import type { HousingSpot, HousingPlacement } from '../types'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/config/placement-spots', () => ({
  SPOT_TYPE_ICONS: { BED: '🛏️', PRIVATE_ROOM: '🚪', STUDIO: '🏠', ROOM: '🚿' },
  SPOT_STATUS_LABELS: { AVAILABLE: 'Verfügbar', OCCUPIED: 'Belegt', MAINTENANCE: 'Wartung', CLOSED: 'Geschlossen' },
}))

jest.mock('@/lib/constants/labels', () => ({
  HOUSING_SPOTS_LABELS: {
    emptyRoomView: 'Keine Plätze definiert für diese Unterkunft',
    addSpotsBtn: 'Plätze hinzufügen',
    requiresMedDocs: 'Erfordert med. Dokumentation',
    occupied: 'Belegt',
    available: 'Frei',
  },
  PLACEMENT_PANEL_LABELS: {
    place: 'Platzieren',
  },
}))

jest.mock('../BedGrid', () => ({
  BedGrid: ({ spots, onBedClick }: { spots: HousingSpot[]; onBedClick?: (spot: HousingSpot) => void }) => (
    <div data-testid="bed-grid" data-count={spots.length}>
      {spots.map(s => (
        <button key={s.id} onClick={() => onBedClick?.(s)} data-testid={`bed-${s.id}`}>
          {s.code}
        </button>
      ))}
    </div>
  ),
  BedGridSummary: ({ occupied, available, unavailable }: { occupied: number; available: number; unavailable: number }) => (
    <div data-testid="bed-grid-summary" data-occupied={occupied} data-available={available} data-unavailable={unavailable} />
  ),
}))

// --- Helpers ---

function makePlacement(residentId: string, status = 'ACTIVE'): HousingPlacement {
  return {
    id: `pl-${residentId}`,
    resident: {
      id: residentId,
      code: `RES-${residentId}`,
      ageRange: 'ADULT',
      gender: 'PREFER_NOT_SAY',
      languages: ['de'],
      socialStyle: 'MODERATE',
      sleepSchedule: 'STANDARD',
      smokingStatus: 'NON_SMOKER',
      noiseTolerance: 3,
      cleanlinessPractice: 3,
      privacyNeed: 3,
    },
    status,
  }
}

function makeSpot(overrides: Partial<HousingSpot> & { id: string }): HousingSpot {
  return {
    id: overrides.id,
    code: overrides.code ?? `SPOT-${overrides.id}`,
    label: overrides.label ?? null,
    type: overrides.type ?? 'BED',
    status: overrides.status ?? 'AVAILABLE',
    squareMeters: overrides.squareMeters ?? null,
    requiresMedicalDocs: overrides.requiresMedicalDocs ?? false,
    parentSpotId: overrides.parentSpotId ?? null,
    placements: overrides.placements ?? [],
  }
}

const UNIT_ID = 'unit-1'

// --- Tests ---

describe('RoomVisualization', () => {
  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows empty state message when no spots', () => {
    render(<RoomVisualization spots={[]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Keine Plätze definiert für diese Unterkunft')).toBeInTheDocument()
  })

  it('links to spots/new in empty state', () => {
    render(<RoomVisualization spots={[]} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('link', { name: 'Plätze hinzufügen' })).toHaveAttribute(
      'href',
      `/housing/${UNIT_ID}/spots/new`
    )
  })

  // ── ROOM containers ───────────────────────────────────────────────────────

  it('renders room code when label is null', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM', code: 'Z1', label: null })
    render(<RoomVisualization spots={[room]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Z1')).toBeInTheDocument()
  })

  it('renders room label when provided', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM', code: 'Z1', label: 'Zimmer Nord' })
    render(<RoomVisualization spots={[room]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Zimmer Nord')).toBeInTheDocument()
  })

  it('shows squareMeters in room header when present', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM', squareMeters: 22 })
    render(<RoomVisualization spots={[room]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/22m²/)).toBeInTheDocument()
  })

  it('shows occupancy count in room header', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const bed1 = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', placements: [makePlacement('res1')] })
    const bed2 = makeSpot({ id: 'b2', type: 'BED', parentSpotId: 'r1', placements: [] })
    render(<RoomVisualization spots={[room, bed1, bed2]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText(/1\/2 belegt/)).toBeInTheDocument()
  })

  it('shows "Keine Betten definiert" for empty room', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    render(<RoomVisualization spots={[room]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Keine Betten definiert')).toBeInTheDocument()
  })

  it('renders BedGrid for room children when useBedGrid=true (default)', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const bed = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1' })
    render(<RoomVisualization spots={[room, bed]} housingUnitId={UNIT_ID} />)
    expect(screen.getByTestId('bed-grid')).toBeInTheDocument()
  })

  it('passes correct count to BedGrid', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const b1 = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1' })
    const b2 = makeSpot({ id: 'b2', type: 'BED', parentSpotId: 'r1' })
    render(<RoomVisualization spots={[room, b1, b2]} housingUnitId={UNIT_ID} />)
    expect(screen.getByTestId('bed-grid')).toHaveAttribute('data-count', '2')
  })

  it('passes BedGridSummary with correct occupied/available counts', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const occupied = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', placements: [makePlacement('r1')] })
    const available = makeSpot({ id: 'b2', type: 'BED', parentSpotId: 'r1', status: 'AVAILABLE', placements: [] })
    render(<RoomVisualization spots={[room, occupied, available]} housingUnitId={UNIT_ID} />)
    const summary = screen.getByTestId('bed-grid-summary')
    expect(summary).toHaveAttribute('data-occupied', '1')
    expect(summary).toHaveAttribute('data-available', '1')
    expect(summary).toHaveAttribute('data-unavailable', '0')
  })

  it('shows SpotCard list (not BedGrid) when useBedGrid=false', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const bed = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', code: 'B1' })
    render(<RoomVisualization spots={[room, bed]} housingUnitId={UNIT_ID} useBedGrid={false} />)
    expect(screen.queryByTestId('bed-grid')).not.toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('shows OccupancyIndicator (not BedGridSummary) when useBedGrid=false', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    render(<RoomVisualization spots={[room]} housingUnitId={UNIT_ID} useBedGrid={false} />)
    expect(screen.queryByTestId('bed-grid-summary')).not.toBeInTheDocument()
    // OccupancyIndicator shows percentage
    expect(screen.getByText(/0%/)).toBeInTheDocument()
  })

  // ── Top-level assignable spots ────────────────────────────────────────────

  it('renders top-level PRIVATE_ROOM (no parent) as SpotCard', () => {
    const pr = makeSpot({ id: 'p1', type: 'PRIVATE_ROOM', code: 'PR-1' })
    render(<RoomVisualization spots={[pr]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('PR-1')).toBeInTheDocument()
  })

  it('renders top-level STUDIO as SpotCard', () => {
    const studio = makeSpot({ id: 's1', type: 'STUDIO', code: 'ST-A', label: 'Studio A' })
    render(<RoomVisualization spots={[studio]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Studio A')).toBeInTheDocument()
  })

  // ── SpotCard: occupied state ──────────────────────────────────────────────

  it('shows resident link when spot is occupied', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', placements: [makePlacement('abc')] })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('link', { name: 'RES-abc' })).toHaveAttribute('href', '/residents/abc')
  })

  it('shows "Belegt" badge when spot is occupied', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', placements: [makePlacement('abc')] })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Belegt')).toBeInTheDocument()
  })

  it('ignores non-ACTIVE placements for occupied check', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', status: 'AVAILABLE', placements: [makePlacement('abc', 'ENDED')] })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    // Should show available, not occupied
    expect(screen.getByText('Frei')).toBeInTheDocument()
  })

  // ── SpotCard: available state ─────────────────────────────────────────────

  it('shows "Frei" badge for available spots', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', status: 'AVAILABLE' })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Frei')).toBeInTheDocument()
  })

  it('shows status label for unavailable spots (MAINTENANCE)', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', status: 'MAINTENANCE' })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.getAllByText('Wartung').length).toBeGreaterThanOrEqual(1)
  })

  // ── SpotCard: onPlaceResident callback ────────────────────────────────────

  it('shows "Platzieren" button on available top-level spot when onPlaceResident given', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', status: 'AVAILABLE' })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} onPlaceResident={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Platzieren' })).toBeInTheDocument()
  })

  it('calls onPlaceResident with spot id when "Platzieren" clicked', () => {
    const onPlace = jest.fn()
    const spot = makeSpot({ id: 'spot-99', type: 'PRIVATE_ROOM', status: 'AVAILABLE' })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} onPlaceResident={onPlace} />)
    fireEvent.click(screen.getByRole('button', { name: 'Platzieren' }))
    expect(onPlace).toHaveBeenCalledWith('spot-99')
  })

  it('hides "Platzieren" button when onPlaceResident not provided', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', status: 'AVAILABLE' })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.queryByRole('button', { name: 'Platzieren' })).not.toBeInTheDocument()
  })

  // ── BedGrid click → onAvailableBedClick ───────────────────────────────────

  it('passes onAvailableBedClick through BedGrid stub when provided', () => {
    const onBedClick = jest.fn()
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const bed = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', code: 'B1' })
    render(
      <RoomVisualization
        spots={[room, bed]}
        housingUnitId={UNIT_ID}
        onAvailableBedClick={onBedClick}
      />
    )
    fireEvent.click(screen.getByTestId('bed-b1'))
    expect(onBedClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }))
  })

  it('calls onPlaceResident via BedGrid when onAvailableBedClick not provided', () => {
    const onPlace = jest.fn()
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const bed = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', code: 'B1' })
    render(
      <RoomVisualization
        spots={[room, bed]}
        housingUnitId={UNIT_ID}
        onPlaceResident={onPlace}
      />
    )
    fireEvent.click(screen.getByTestId('bed-b1'))
    expect(onPlace).toHaveBeenCalledWith('b1')
  })

  // ── Medical docs badge ────────────────────────────────────────────────────

  it('shows "Med." badge when spot requires medical docs', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', requiresMedicalDocs: true })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.getByText('Med.')).toBeInTheDocument()
  })

  it('hides "Med." badge when not required', () => {
    const spot = makeSpot({ id: 's1', type: 'PRIVATE_ROOM', requiresMedicalDocs: false })
    render(<RoomVisualization spots={[spot]} housingUnitId={UNIT_ID} />)
    expect(screen.queryByText('Med.')).not.toBeInTheDocument()
  })

  // ── OccupancyIndicator (useBedGrid=false) ─────────────────────────────────

  it('shows 50% occupancy when half beds occupied', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const b1 = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', placements: [makePlacement('r1')] })
    const b2 = makeSpot({ id: 'b2', type: 'BED', parentSpotId: 'r1', placements: [] })
    render(<RoomVisualization spots={[room, b1, b2]} housingUnitId={UNIT_ID} useBedGrid={false} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 100% occupancy when all beds occupied', () => {
    const room = makeSpot({ id: 'r1', type: 'ROOM' })
    const b1 = makeSpot({ id: 'b1', type: 'BED', parentSpotId: 'r1', placements: [makePlacement('r1')] })
    const b2 = makeSpot({ id: 'b2', type: 'BED', parentSpotId: 'r1', placements: [makePlacement('r2')] })
    render(<RoomVisualization spots={[room, b1, b2]} housingUnitId={UNIT_ID} useBedGrid={false} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
