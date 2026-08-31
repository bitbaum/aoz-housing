import type { Mock } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/constants', () => ({
  UI_LABELS: { selectPlaceholder: 'Bitte wählen' },
  PLACEMENT_ACTIONS_LABELS: {
    spotsAvailableCount: (count: number) => `${count} Plätze frei`,
  },
}))

vi.mock('@/components/residents/TransferRecommendations', () => ({
  TransferRecommendations: ({
    eligibleUnits,
    selectedUnitId,
    onUnitSelect,
  }: {
    eligibleUnits: { id: string; code: string }[]
    selectedUnitId: string
    onUnitSelect: (id: string) => void
  }) => (
    <div data-testid="transfer-recommendations">
      {eligibleUnits.map((u) => (
        <button key={u.id} onClick={() => onUnitSelect(u.id)}>
          {u.code}
        </button>
      ))}
      <span data-testid="selected">{selectedUnitId}</span>
    </div>
  ),
}))

import { TransferUnitSelector } from '../TransferUnitSelector'
import type { UnitCompatibilityData } from '../TransferUnitSelector'

// --- Helpers ---

function makeUnit(
  id: string,
  code: string,
  address = 'Musterstrasse 1',
  spots: { type: string }[] = [],
) {
  return { id, code, address, spots }
}

const ELIGIBLE_SPOT_TYPES = ['BED', 'ROOM']

function renderSelector(overrides: {
  eligibleUnits?: ReturnType<typeof makeUnit>[]
  selectedUnitId?: string
  onUnitSelect?: Mock
  unitCompatibility?: Record<string, UnitCompatibilityData>
}) {
  const onUnitSelect = overrides.onUnitSelect ?? vi.fn()
  render(
    <TransferUnitSelector
      eligibleUnits={(overrides.eligibleUnits ?? []) as never}
      eligibleSpotTypes={ELIGIBLE_SPOT_TYPES}
      selectedUnitId={overrides.selectedUnitId ?? ''}
      onUnitSelect={onUnitSelect}
      unitCompatibility={overrides.unitCompatibility}
    />,
  )
  return { onUnitSelect }
}

// --- Tests ---

describe('TransferUnitSelector — fallback select mode', () => {
  it('renders a select element when no unitCompatibility provided', () => {
    renderSelector({ eligibleUnits: [makeUnit('u1', 'HU-001')] })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders placeholder option', () => {
    renderSelector({})
    expect(screen.getByRole('option', { name: 'Bitte wählen' })).toBeInTheDocument()
  })

  it('renders one option per eligible unit', () => {
    renderSelector({
      eligibleUnits: [
        makeUnit('u1', 'HU-001', 'Hauptstrasse 1', [{ type: 'BED' }]),
        makeUnit('u2', 'HU-002', 'Bahnhofstrasse 2', [{ type: 'BED' }]),
      ],
    })
    expect(screen.getByRole('option', { name: /HU-001/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /HU-002/ })).toBeInTheDocument()
  })

  it('shows spot count in option label', () => {
    renderSelector({
      eligibleUnits: [
        makeUnit('u1', 'HU-001', 'Hauptstrasse 1', [{ type: 'BED' }, { type: 'BED' }]),
      ],
    })
    expect(screen.getByRole('option', { name: /2 Plätze frei/ })).toBeInTheDocument()
  })

  it('only counts spots matching eligibleSpotTypes', () => {
    renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001', 'Str 1', [{ type: 'BED' }, { type: 'STORAGE' }])],
    })
    // BED matches, STORAGE does not
    expect(screen.getByRole('option', { name: /1 Plätze frei/ })).toBeInTheDocument()
  })

  it('reflects selectedUnitId as select value', () => {
    renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001', 'Str 1', [{ type: 'BED' }])],
      selectedUnitId: 'u1',
    })
    expect(screen.getByRole('combobox')).toHaveValue('u1')
  })

  it('calls onUnitSelect when selection changes', () => {
    const { onUnitSelect } = renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001', 'Str 1', [{ type: 'BED' }])],
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'u1' } })
    expect(onUnitSelect).toHaveBeenCalledWith('u1')
  })

  it('renders select when unitCompatibility is empty object', () => {
    renderSelector({ unitCompatibility: {} })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

describe('TransferUnitSelector — recommendation mode', () => {
  const compat: Record<string, UnitCompatibilityData> = {
    u1: { fitScore: 80, strengths: [], concerns: [], residents: [] },
  }

  it('renders TransferRecommendations when unitCompatibility has entries', () => {
    renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001')],
      unitCompatibility: compat,
    })
    expect(screen.getByTestId('transfer-recommendations')).toBeInTheDocument()
  })

  it('does NOT render a select in recommendation mode', () => {
    renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001')],
      unitCompatibility: compat,
    })
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('propagates onUnitSelect through TransferRecommendations', () => {
    const { onUnitSelect } = renderSelector({
      eligibleUnits: [makeUnit('u1', 'HU-001')],
      unitCompatibility: compat,
    })
    fireEvent.click(screen.getByRole('button', { name: 'HU-001' }))
    expect(onUnitSelect).toHaveBeenCalledWith('u1')
  })
})
