import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransferRecommendations } from '../TransferRecommendations'
import { TransferUnitSelector } from '../TransferUnitSelector'
import type { UnitWithSpots } from '@/lib/types'

// --- Mocks ---

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

jest.mock('@/lib/config/placement-spots', () => ({
  SPOT_TYPE_LABELS: { BED: 'Bett', PRIVATE_ROOM: 'Einzelzimmer' },
  SPOT_TYPE_ICONS: { BED: '🛏', PRIVATE_ROOM: '🚪' },
}))

jest.mock('@/lib/config/thresholds', () => ({
  getScoreLevel: (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'moderate'
    if (score >= 20) return 'low'
    return 'critical'
  },
  DISPLAY_LIMITS: { topUnits: 5 },
}))

jest.mock('@/lib/utils/formatting', () => ({
  getScoreColorClass: () => 'text-green-600',
  getScoreBgClass: () => 'bg-green-50',
}))

jest.mock('@/lib/constants/labels/scores', () => ({
  COMPATIBILITY_SCORE_LABELS: {
    excellent: 'Sehr gut',
    good: 'Gut',
    moderate: 'Mittel',
    low: 'Niedrig',
    critical: 'Kritisch',
  },
}))

// --- Fixtures ---

function makeUnit(id: string, code: string, overrides: Partial<UnitWithSpots> = {}): UnitWithSpots {
  return {
    id,
    code,
    address: `${code} Strasse 1`,
    spots: [{ id: `${id}-spot-1`, code: 'S1', type: 'BED' as const, label: 'Bett 1' }],
    ...overrides,
  }
}

const BASE_PROPS = {
  eligibleSpotTypes: ['BED'],
  selectedUnitId: '',
  onUnitSelect: jest.fn(),
}

// --- TransferRecommendations Tests ---

describe('TransferRecommendations', () => {
  const onUnitSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows empty state when no eligible units', () => {
    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={[]}
        onUnitSelect={onUnitSelect}
      />
    )

    expect(screen.getByText(/Keine Unterkünfte/i)).toBeInTheDocument()
  })

  test('renders unit list sorted by fit score', () => {
    const units = [makeUnit('u1', 'HU-001'), makeUnit('u2', 'HU-002')]
    const unitCompatibility = {
      'u1': { fitScore: 60, strengths: [], concerns: [], residents: [] },
      'u2': { fitScore: 85, strengths: [], concerns: [], residents: [] },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    // Use font-semibold code elements specifically (not address strings)
    const unitCodeEls = screen.getAllByRole('button').map(btn => {
      const codeEl = btn.querySelector('.font-semibold')
      return codeEl?.textContent
    }).filter(Boolean)

    // HU-002 (85%) should appear before HU-001 (60%) after sorting
    expect(unitCodeEls[0]).toBe('HU-002')
    expect(unitCodeEls[1]).toBe('HU-001')
  })

  test('shows fit scores for each unit', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': { fitScore: 75, strengths: [], concerns: [], residents: [] },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  test('shows "Empfohlen" badge for top excellent unit', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': { fitScore: 90, strengths: [], concerns: [], residents: [] },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    expect(screen.getByText('Empfohlen')).toBeInTheDocument()
  })

  test('calls onUnitSelect when unit button is clicked', () => {
    const units = [makeUnit('u1', 'HU-001')]

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
      />
    )

    fireEvent.click(screen.getByText('HU-001').closest('button')!)
    expect(onUnitSelect).toHaveBeenCalledWith('u1')
  })

  test('shows "Leer" label for empty units', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': { fitScore: 70, strengths: [], concerns: [], residents: [] },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    expect(screen.getByText(/Leer - keine Mitbewohner/i)).toBeInTheDocument()
  })

  test('shows resident codes for occupied units', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': {
        fitScore: 70,
        strengths: [],
        concerns: [],
        residents: [
          { id: 'r1', code: 'RES-001', displayName: null, compatibilityScore: 75, keyFactors: [] },
        ],
      },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    expect(screen.getByText(/RES-001 \(75%\)/)).toBeInTheDocument()
  })

  test('shows expand/collapse button for occupied units', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': {
        fitScore: 70,
        strengths: [],
        concerns: [],
        residents: [{ id: 'r1', code: 'RES-001', displayName: null, compatibilityScore: 75, keyFactors: [] }],
      },
    }

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    expect(screen.getByText(/Details zu Mitbewohnern anzeigen/i)).toBeInTheDocument()
  })

  test('shows "Alle anzeigen" button when more than DISPLAY_LIMITS.topUnits units', () => {
    // 6 units > topUnits (5)
    const units = Array.from({ length: 6 }, (_, i) => makeUnit(`u${i}`, `HU-00${i}`))

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
      />
    )

    expect(screen.getByText(/weitere Unterkünfte anzeigen/i)).toBeInTheDocument()
  })

  test('uses default fit score 50 when no compatibility data provided', () => {
    const units = [makeUnit('u1', 'HU-001')]

    render(
      <TransferRecommendations
        {...BASE_PROPS}
        eligibleUnits={units}
        onUnitSelect={onUnitSelect}
      />
    )

    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})

// --- TransferUnitSelector Tests ---

describe('TransferUnitSelector', () => {
  const onUnitSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders rich view when compatibility data provided', () => {
    const units = [makeUnit('u1', 'HU-001')]
    const unitCompatibility = {
      'u1': { fitScore: 80, strengths: [], concerns: [], residents: [] },
    }

    render(
      <TransferUnitSelector
        eligibleUnits={units}
        eligibleSpotTypes={['BED']}
        selectedUnitId=""
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )

    // Rich view renders score
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  test('renders simple dropdown when no compatibility data', () => {
    const units = [makeUnit('u1', 'HU-001')]

    render(
      <TransferUnitSelector
        eligibleUnits={units}
        eligibleSpotTypes={['BED']}
        selectedUnitId=""
        onUnitSelect={onUnitSelect}
      />
    )

    // Simple dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText(/HU-001/)).toBeInTheDocument()
  })
})
