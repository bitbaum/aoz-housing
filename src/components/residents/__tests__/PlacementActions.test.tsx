import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlacementActions } from '../PlacementActions'
import type { UnitWithSpots } from '@/lib/types'

// --- Mocks ---

// Suppress React 18 jsdom warning: Next.js server action functions passed to
// <form action> are valid in the App Router but React 18 DOM doesn't know that.
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Invalid value for prop') &&
      args[1] === '`action`'
    ) {
      return
    }
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

jest.mock('@/lib/actions', () => ({
  endPlacement: jest.fn(),
  transferPlacement: jest.fn(),
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
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

jest.mock('@/lib/constants', () => ({
  END_REASON_LABELS: {
    NATURAL_END: 'Natürliches Ende',
    CONFLICT: 'Konflikt',
    TRANSFER: 'Verlegung',
  },
  END_REASON_DESCRIPTIONS: {
    NATURAL_END: 'Reguläres Ablaufen der Unterbringung',
    CONFLICT: 'Konflikt mit Mitbewohnern',
    TRANSFER: 'Verlegung in andere Unterkunft',
  },
  COMPATIBILITY_GAP_LABELS: {
    LIFESTYLE: 'Lebensstil',
    LANGUAGE: 'Sprache',
  },
}))

jest.mock('@/lib/config/thresholds', () => ({
  DISPLAY_LIMITS: { descriptionPreview: 50 },
}))

jest.mock('../TransferRecommendations', () => ({
  TransferUnitSelector: ({
    eligibleUnits,
    onUnitSelect,
  }: {
    eligibleUnits: Array<{ id: string; code: string }>
    onUnitSelect: (id: string) => void
  }) => (
    <select
      aria-label="Ziel-Unterkunft auswählen"
      onChange={(e) => onUnitSelect(e.target.value)}
    >
      <option value="">Auswählen</option>
      {eligibleUnits.map((u) => (
        <option key={u.id} value={u.id}>
          {u.code}
        </option>
      ))}
    </select>
  ),
}))

// --- Fixtures ---

const UNIT_WITH_SPOTS: UnitWithSpots = {
  id: 'unit-2',
  code: 'HU-002',
  address: 'Teststrasse 2',
  spots: [{ id: 'spot-1', code: 'S1', type: 'BED' as const, label: 'Bett 1' }],
}

const DEFAULT_PROPS = {
  placementId: 'placement-1',
  residentId: 'resident-1',
  currentUnitId: 'unit-1',
  hasMedicalDocumentation: false,
  availableUnits: [UNIT_WITH_SPOTS],
  eligibleSpotTypes: ['BED'],
}

// --- Tests ---

describe('PlacementActions', () => {
  test('renders action buttons', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    expect(screen.getByRole('link', { name: /Check-in durchführen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verlegen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Beenden/i })).toBeInTheDocument()
  })

  test('check-in link points to correct placement', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    const link = screen.getByRole('link', { name: /Check-in durchführen/i })
    expect(link).toHaveAttribute('href', '/placements/placement-1/checkin')
  })

  test('clicking Verlegen shows transfer form', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verlegen bestätigen/i })).toBeInTheDocument()
  })

  test('clicking Beenden shows end form', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))

    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Platzierung endgültig beenden/i })).toBeInTheDocument()
  })

  test('clicking Verlegen hides Beenden form if open', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))
    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))
    expect(screen.queryByText(/Platzierung beenden/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
  })

  test('clicking Verlegen again toggles form off', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    const verlegenBtn = screen.getByRole('button', { name: /^🔄 Verlegen$/i })
    fireEvent.click(verlegenBtn)
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()

    fireEvent.click(verlegenBtn)
    expect(screen.queryByText(/Bewohner verlegen/i)).not.toBeInTheDocument()
  })

  test('shows warning when no eligible units available', () => {
    render(<PlacementActions {...DEFAULT_PROPS} availableUnits={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    expect(screen.getByText(/keine geeigneten Ziel-Unterkünfte/i)).toBeInTheDocument()
  })

  test('transfer submit button disabled when no unit selected', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    const submitBtn = screen.getByRole('button', { name: /Verlegen bestätigen/i })
    expect(submitBtn).toBeDisabled()
  })

  test('closes transfer form via X button', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /✕ Schliessen/i }))
    expect(screen.queryByText(/Bewohner verlegen/i)).not.toBeInTheDocument()
  })

  test('end form shows end reason radio buttons', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))

    expect(screen.getByLabelText(/Natürliches Ende/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Konflikt/i)).toBeInTheDocument()
  })

  test('shows conflict analysis fields when CONFLICT reason selected', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))
    fireEvent.click(screen.getByLabelText(/Konflikt/i))

    expect(screen.getByText(/Konfliktanalyse/i)).toBeInTheDocument()
    // Label exists (select has no id, so we check by text instead of getByLabelText)
    expect(screen.getByText(/Hauptursache des Konflikts/i)).toBeInTheDocument()
  })

  test('opens transfer form when initialAction is transfer', () => {
    render(<PlacementActions {...DEFAULT_PROPS} initialAction="transfer" />)

    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
  })

  test('opens end form when initialAction is end', () => {
    render(<PlacementActions {...DEFAULT_PROPS} initialAction="end" />)

    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()
  })
})
