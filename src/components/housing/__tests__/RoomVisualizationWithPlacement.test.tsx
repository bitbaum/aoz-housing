import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// --- Mocks ---

const mockRouterRefresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

const mockCreatePlacement = vi.hoisted(() => vi.fn())
vi.mock('@/lib/actions/placements', () => ({
  createPlacement: (...args: unknown[]) => mockCreatePlacement(...args),
}))

vi.mock('@/components/housing/RoomVisualization', () => ({
  RoomVisualization: ({
    spots,
    housingUnitId,
    onAvailableBedClick,
  }: {
    spots: { id: string; code: string; status: string }[]
    housingUnitId: string
    onAvailableBedClick: (spot: { id: string; code: string }) => void
  }) => (
    <div data-testid="room-visualization" data-unit={housingUnitId}>
      {spots.map((s) => (
        <button key={s.id} data-testid={`spot-${s.id}`} onClick={() => onAvailableBedClick(s)}>
          {s.code}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/housing/PlacementPanel', () => ({
  PlacementPanel: ({
    isOpen,
    onClose,
    spot,
    compatibleResidents,
    onPlaceResident,
    housingUnitId,
  }: {
    isOpen: boolean
    onClose: () => void
    spot: { id: string; code: string } | null
    compatibleResidents: { resident: { id: string } }[]
    onPlaceResident: (residentId: string, spotId: string) => Promise<void>
    housingUnitId: string
  }) => (
    <div
      data-testid="placement-panel"
      data-open={String(isOpen)}
      data-spot={spot?.id ?? ''}
      data-unit={housingUnitId}
    >
      <button onClick={onClose}>Close panel</button>
      {compatibleResidents.map((r) => (
        <button key={r.resident.id} onClick={() => onPlaceResident(r.resident.id, spot?.id ?? '')}>
          Place {r.resident.id}
        </button>
      ))}
    </div>
  ),
}))

import { RoomVisualizationWithPlacement } from '../RoomVisualizationWithPlacement'
import type { HousingSpot, CompatibleResident } from '../types'

// --- Helpers ---

function makeSpot(id: string, code = `SPOT-${id}`): HousingSpot {
  return {
    id,
    code,
    label: null,
    type: 'BED',
    status: 'AVAILABLE',
    requiresMedicalDocs: false,
    parentSpotId: null,
    placements: [],
  }
}

const RESIDENTS: CompatibleResident[] = [
  {
    resident: {
      id: 'r1',
      code: 'RES-001',
      displayName: null,
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
    fitScore: 85,
    strengths: [],
    concerns: [],
  },
]

function renderComponent(overrides: {
  spots?: HousingSpot[]
  compatibleResidents?: CompatibleResident[]
  housingUnitId?: string
}) {
  render(
    <RoomVisualizationWithPlacement
      spots={overrides.spots ?? []}
      housingUnitId={overrides.housingUnitId ?? 'unit-1'}
      compatibleResidents={overrides.compatibleResidents ?? RESIDENTS}
    />,
  )
}

// --- Tests ---

describe('RoomVisualizationWithPlacement', () => {
  beforeEach(() => {
    mockRouterRefresh.mockClear()
    mockCreatePlacement.mockResolvedValue(undefined)
  })

  it('renders RoomVisualization', () => {
    renderComponent({})
    expect(screen.getByTestId('room-visualization')).toBeInTheDocument()
  })

  it('passes housingUnitId to RoomVisualization', () => {
    renderComponent({ housingUnitId: 'unit-abc' })
    expect(screen.getByTestId('room-visualization')).toHaveAttribute('data-unit', 'unit-abc')
  })

  it('renders PlacementPanel (closed initially)', () => {
    renderComponent({})
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-open', 'false')
  })

  it('opens panel when a bed is clicked', () => {
    renderComponent({ spots: [makeSpot('s1')] })
    fireEvent.click(screen.getByTestId('spot-s1'))
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-open', 'true')
  })

  it('sets selected spot on panel when bed clicked', () => {
    renderComponent({ spots: [makeSpot('s1')] })
    fireEvent.click(screen.getByTestId('spot-s1'))
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-spot', 's1')
  })

  it('closes panel when close button clicked', () => {
    renderComponent({ spots: [makeSpot('s1')] })
    fireEvent.click(screen.getByTestId('spot-s1'))
    fireEvent.click(screen.getByText('Close panel'))
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-open', 'false')
  })

  it('clears selected spot after panel closes', () => {
    renderComponent({ spots: [makeSpot('s1')] })
    fireEvent.click(screen.getByTestId('spot-s1'))
    fireEvent.click(screen.getByText('Close panel'))
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-spot', '')
  })

  it('calls createPlacement with correct args when resident placed', async () => {
    renderComponent({ spots: [makeSpot('s1')], compatibleResidents: RESIDENTS })
    fireEvent.click(screen.getByTestId('spot-s1'))
    await act(async () => {
      fireEvent.click(screen.getByText('Place r1'))
    })
    expect(mockCreatePlacement).toHaveBeenCalledWith(
      expect.objectContaining({ residentId: 'r1', spotId: 's1', housingUnitId: 'unit-1' }),
    )
  })

  it('calls router.refresh after placement', async () => {
    renderComponent({ spots: [makeSpot('s1')], compatibleResidents: RESIDENTS })
    fireEvent.click(screen.getByTestId('spot-s1'))
    await act(async () => {
      fireEvent.click(screen.getByText('Place r1'))
    })
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1)
  })

  it('passes housingUnitId to PlacementPanel', () => {
    renderComponent({ housingUnitId: 'unit-xyz' })
    expect(screen.getByTestId('placement-panel')).toHaveAttribute('data-unit', 'unit-xyz')
  })

  it('passes spots to RoomVisualization', () => {
    renderComponent({ spots: [makeSpot('s1', 'BED-1'), makeSpot('s2', 'BED-2')] })
    expect(screen.getByTestId('spot-s1')).toBeInTheDocument()
    expect(screen.getByTestId('spot-s2')).toBeInTheDocument()
  })
})
