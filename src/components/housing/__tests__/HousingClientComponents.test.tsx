import type { Mock } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// =============================================================================
// Mocks shared across suites
// =============================================================================

const mockRouter = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// --- DangerZone mock (captures props for assertion) ---

const MockDangerZone = vi.hoisted(() =>
  vi.fn(
    ({
      entityType,
      entityId,
      entityCode,
      redirectPath,
      ariaId,
    }: {
      entityType: string
      entityId: string
      entityCode: string
      redirectPath: string
      ariaId: string
    }) => (
      <div
        data-testid="danger-zone"
        data-entity-type={entityType}
        data-entity-id={entityId}
        data-entity-code={entityCode}
        data-redirect-path={redirectPath}
        data-aria-id={ariaId}
      />
    ),
  ),
)

vi.mock('@/components/ui/DangerZone', () => ({
  DangerZone: MockDangerZone,
}))

// --- Label mocks for HousingDangerZone ---

vi.mock('@/lib/constants/labels', () => ({
  HOUSING_DANGER_ZONE_LABELS: {
    title: 'Housing Danger Zone',
    description: 'Housing delete description',
    notEligible: 'Not eligible',
    blockerReportTitle: 'Blocker:',
    noDetails: 'No details',
    copyReport: 'Copy',
    copiedToClipboard: 'Copied',
    confirmPlaceholder: 'Confirm',
    reasonPlaceholder: 'Reason',
    deleteButton: 'Delete',
    deleteFailed: 'Failed',
    deleteSuccess: 'Success',
  },
  HOUSING_BLOCKER_LABELS: { placements: 'Platzierungen', spots: 'Spots' },
  DANGER_ZONE_LABELS: {
    title: 'Resident Danger Zone',
    description: 'Resident delete description',
    notTestResident: 'Not test resident',
    blockerReport: 'Blocker:',
    noDetails: 'No details',
    copiedToClipboard: 'Copied',
    copyReport: 'Copy',
    confirmLabel: 'Confirm',
    reasonLabel: 'Reason',
    deleteFailed: 'Failed',
    deleteSuccess: 'Success',
    deleteButton: 'Delete',
    blockers: {
      placements: 'Platzierungen',
      incidentsReported: 'Vorfälle',
      incidentsSubject: 'Betroffene',
      incidentInvolvements: 'Beteiligungen',
      maintenanceReports: 'Wartung',
      compatibilityAssessments: 'Assessments',
    },
  },
}))

vi.mock('@/lib/constants', () => ({
  DANGER_ZONE_LABELS: {
    title: 'Resident Danger Zone',
    description: 'Resident delete description',
    notTestResident: 'Not test resident',
    blockerReport: 'Blocker:',
    noDetails: 'No details',
    copiedToClipboard: 'Copied',
    copyReport: 'Copy',
    confirmLabel: 'Confirm',
    reasonLabel: 'Reason',
    deleteFailed: 'Failed',
    deleteSuccess: 'Success',
    deleteButton: 'Delete',
    blockers: {
      placements: 'Platzierungen',
      incidentsReported: 'Vorfälle',
      incidentsSubject: 'Betroffene',
      incidentInvolvements: 'Beteiligungen',
      maintenanceReports: 'Wartung',
      compatibilityAssessments: 'Assessments',
    },
  },
}))

vi.mock('@/lib/actions', () => ({
  hardDeleteHousingUnitProtected: vi.fn(),
  hardDeleteResidentProtected: vi.fn(),
}))

// --- RoomVisualizationWithPlacement mocks ---

import type { HousingSpot } from '../types'

const STUB_SPOT: HousingSpot = {
  id: 's1',
  code: 'S-01',
  label: 'Bett 1',
  type: 'BED',
  status: 'AVAILABLE',
  requiresMedicalDocs: false,
  parentSpotId: null,
  placements: [],
}

const MockPlacementPanel = vi.hoisted(() =>
  vi.fn(
    ({
      isOpen,
      onClose,
      onPlaceResident,
    }: {
      isOpen: boolean
      onClose: () => void
      onPlaceResident: (residentId: string, spotId: string) => Promise<void>
      spot: HousingSpot | null
      compatibleResidents: unknown[]
      housingUnitId: string
    }) => (
      <div data-testid={`panel-${isOpen ? 'open' : 'closed'}`}>
        <button onClick={onClose}>Schliessen</button>
        <button onClick={() => onPlaceResident('r1', 's1')}>Platzieren</button>
      </div>
    ),
  ),
)

vi.mock('../PlacementPanel', () => ({
  PlacementPanel: MockPlacementPanel,
}))

vi.mock('../RoomVisualization', () => ({
  RoomVisualization: ({
    spots,
    onAvailableBedClick,
  }: {
    spots: HousingSpot[]
    housingUnitId: string
    onAvailableBedClick?: (spot: HousingSpot) => void
    useBedGrid?: boolean
  }) => (
    <div data-testid="room-visualization" data-spot-count={spots.length}>
      {spots.map((spot) => (
        <button
          key={spot.id}
          onClick={() => onAvailableBedClick?.(spot)}
          data-testid={`spot-${spot.id}`}
        >
          {spot.code}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/lib/actions/placements', () => ({
  createPlacement: vi.fn().mockResolvedValue({ success: true }),
}))

// =============================================================================
// Component imports (after mocks)
// =============================================================================

import { HousingDangerZone } from '../HousingDangerZone'
import { ResidentDangerZone } from '../../residents/ResidentDangerZone'
import { RoomVisualizationWithPlacement } from '../RoomVisualizationWithPlacement'
import { createPlacement } from '@/lib/actions/placements'

// =============================================================================
// HousingDangerZone
// =============================================================================

describe('HousingDangerZone', () => {
  beforeEach(() => {
    MockDangerZone.mockClear()
  })

  it('renders a DangerZone component', () => {
    render(<HousingDangerZone housingUnitId="hu-1" code="HU-TEST" />)
    expect(screen.getByTestId('danger-zone')).toBeInTheDocument()
  })

  it('passes entityType="HousingUnit"', () => {
    render(<HousingDangerZone housingUnitId="hu-1" code="HU-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-type', 'HousingUnit')
  })

  it('passes the housingUnitId as entityId', () => {
    render(<HousingDangerZone housingUnitId="hu-abc" code="HU-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-id', 'hu-abc')
  })

  it('passes the code as entityCode', () => {
    render(<HousingDangerZone housingUnitId="hu-1" code="HU-XYZ" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-code', 'HU-XYZ')
  })

  it('passes redirectPath=/housing?view=all', () => {
    render(<HousingDangerZone housingUnitId="hu-1" code="HU-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute(
      'data-redirect-path',
      '/housing?view=all',
    )
  })

  it('passes ariaId=housing-danger-zone-title', () => {
    render(<HousingDangerZone housingUnitId="hu-1" code="HU-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute(
      'data-aria-id',
      'housing-danger-zone-title',
    )
  })
})

// =============================================================================
// ResidentDangerZone
// =============================================================================

describe('ResidentDangerZone', () => {
  beforeEach(() => {
    MockDangerZone.mockClear()
  })

  it('renders a DangerZone component', () => {
    render(<ResidentDangerZone residentId="r-1" residentCode="RES-TEST" />)
    expect(screen.getByTestId('danger-zone')).toBeInTheDocument()
  })

  it('passes entityType="Resident"', () => {
    render(<ResidentDangerZone residentId="r-1" residentCode="RES-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-type', 'Resident')
  })

  it('passes the residentId as entityId', () => {
    render(<ResidentDangerZone residentId="r-abc" residentCode="RES-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-id', 'r-abc')
  })

  it('passes the residentCode as entityCode', () => {
    render(<ResidentDangerZone residentId="r-1" residentCode="RES-XYZ" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute('data-entity-code', 'RES-XYZ')
  })

  it('passes redirectPath=/residents?view=all', () => {
    render(<ResidentDangerZone residentId="r-1" residentCode="RES-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute(
      'data-redirect-path',
      '/residents?view=all',
    )
  })

  it('passes ariaId=resident-danger-zone-title', () => {
    render(<ResidentDangerZone residentId="r-1" residentCode="RES-TEST" />)
    expect(screen.getByTestId('danger-zone')).toHaveAttribute(
      'data-aria-id',
      'resident-danger-zone-title',
    )
  })
})

// =============================================================================
// RoomVisualizationWithPlacement
// =============================================================================

describe('RoomVisualizationWithPlacement', () => {
  const BASE_PROPS = {
    spots: [STUB_SPOT],
    housingUnitId: 'hu-1',
    compatibleResidents: [],
  }

  beforeEach(() => {
    mockRouter.push.mockClear()
    mockRouter.refresh.mockClear()
    MockPlacementPanel.mockClear()
    ;(createPlacement as Mock).mockResolvedValue({ success: true })
  })

  it('renders RoomVisualization with spots', () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    expect(screen.getByTestId('room-visualization')).toBeInTheDocument()
  })

  it('panel is closed initially', () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    expect(screen.getByTestId('panel-closed')).toBeInTheDocument()
  })

  it('panel opens when an available bed is clicked', () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('spot-s1'))
    expect(screen.getByTestId('panel-open')).toBeInTheDocument()
  })

  it('panel closes when close button clicked', () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('spot-s1'))
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(screen.getByTestId('panel-closed')).toBeInTheDocument()
  })

  it('passes selected spot to PlacementPanel after bed click', () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('spot-s1'))
    const lastCall = MockPlacementPanel.mock.calls[MockPlacementPanel.mock.calls.length - 1][0]
    expect(lastCall.spot).toEqual(STUB_SPOT)
  })

  it('calls createPlacement when resident placed', async () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('spot-s1'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Platzieren' }))
    })
    expect(createPlacement).toHaveBeenCalledWith(
      expect.objectContaining({ residentId: 'r1', spotId: 's1', housingUnitId: 'hu-1' }),
    )
  })

  it('calls router.refresh after placement', async () => {
    render(<RoomVisualizationWithPlacement {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('spot-s1'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Platzieren' }))
    })
    expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
  })
})
