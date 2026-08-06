import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { BedGrid, BedGridSummary } from '../BedGrid'
import type { HousingSpot } from '../types'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('@/lib/config/placement-spots', () => ({
  SPOT_TYPE_ICONS: {
    BED: 'bed-icon',
    PRIVATE_ROOM: 'room-icon',
    STUDIO: 'studio-icon',
    ROOM: 'room-container-icon',
  },
}))

jest.mock('@/lib/constants', () => ({
  AGE_RANGE_LABELS: {
    YOUNG_ADULT: '18-25',
    ADULT: '26-40',
  },
  LANGUAGE_LABELS: {
    DE: 'Deutsch',
    EN: 'Englisch',
  },
  UI_LABELS: {
    close: 'Schliessen',
  },
  BED_GRID_LABELS: {
    noSpots: 'Keine Plätze definiert',
    age: 'Alter',
    languages: 'Sprachen',
    showProfile: 'Profil anzeigen →',
    freeSuffix: 'frei',
    ariaOccupied: (spot: string, resident: string) => `Platz ${spot}: belegt von ${resident}`,
    ariaAvailable: (spot: string) => `Platz ${spot}: verfügbar`,
    ariaUnavailable: (spot: string) => `Platz ${spot}: nicht verfügbar`,
    titleOccupied: (spot: string, resident: string) => `${spot}: ${resident} - Klicken für Details`,
    titleAvailable: (spot: string) => `${spot}: Verfügbar - Klicken zum Platzieren`,
    titleUnavailable: (spot: string) => `${spot}: Nicht verfügbar`,
  },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] || key,
}))

// =============================================================================
// TEST FIXTURES
// =============================================================================

function makeSpot(overrides: Partial<HousingSpot> = {}): HousingSpot {
  return {
    id: 'spot-1',
    code: 'S-001',
    label: 'Bett 1',
    type: 'BED',
    status: 'AVAILABLE',
    squareMeters: null,
    requiresMedicalDocs: false,
    placements: [],
    ...overrides,
  }
}

function makeOccupiedSpot(overrides: Partial<HousingSpot> = {}): HousingSpot {
  return makeSpot({
    id: 'spot-occupied',
    code: 'S-002',
    label: 'Bett 2',
    status: 'OCCUPIED',
    placements: [
      {
        id: 'placement-1',
        status: 'ACTIVE',
        resident: {
          id: 'res-1',
          code: 'RES-001',
          ageRange: 'YOUNG_ADULT',
          gender: 'MALE',
          languages: ['DE', 'EN'],
          socialStyle: 'MODERATE',
          sleepSchedule: 'STANDARD',
          smokingStatus: 'NON_SMOKER',
          noiseTolerance: 3,
          cleanlinessPractice: 3,
          privacyNeed: 3,
        },
      },
    ],
    ...overrides,
  })
}

function makeUnavailableSpot(): HousingSpot {
  return makeSpot({
    id: 'spot-unavailable',
    code: 'S-003',
    label: 'Bett 3',
    status: 'MAINTENANCE',
    placements: [],
  })
}

// =============================================================================
// BEDGRID TESTS
// =============================================================================

describe('BedGrid', () => {
  describe('empty state', () => {
    it('shows empty message when no spots', () => {
      render(<BedGrid spots={[]} />)

      expect(screen.getByText('Keine Plätze definiert')).toBeInTheDocument()
    })
  })

  describe('rendering spots', () => {
    it('renders all spots', () => {
      const spots = [makeSpot(), makeOccupiedSpot(), makeUnavailableSpot()]
      render(<BedGrid spots={spots} />)

      // Each spot renders the spot type icon
      const icons = screen.getAllByText('bed-icon')
      expect(icons).toHaveLength(3)
    })

    it('renders spot type icon for each spot', () => {
      const spots = [
        makeSpot({ type: 'BED' }),
        makeSpot({ id: 'spot-2', type: 'PRIVATE_ROOM' }),
      ]
      render(<BedGrid spots={spots} />)

      expect(screen.getByText('bed-icon')).toBeInTheDocument()
      expect(screen.getByText('room-icon')).toBeInTheDocument()
    })

    it('shows resident code suffix on occupied spots when showLabels is true', () => {
      const spots = [makeOccupiedSpot()]
      render(<BedGrid spots={spots} showLabels />)

      // Displays last 3 characters of resident code (the distinguishing part)
      expect(screen.getByText('001')).toBeInTheDocument()
    })

    it('does not show resident code when showLabels is false', () => {
      const spots = [makeOccupiedSpot()]
      render(<BedGrid spots={spots} showLabels={false} />)

      expect(screen.queryByText('RES')).not.toBeInTheDocument()
    })
  })

  describe('aria labels', () => {
    it('sets correct aria-label for available spot', () => {
      const spots = [makeSpot()]
      render(<BedGrid spots={spots} />)

      expect(screen.getByLabelText('Platz Bett 1: verfügbar')).toBeInTheDocument()
    })

    it('sets correct aria-label for occupied spot', () => {
      const spots = [makeOccupiedSpot()]
      render(<BedGrid spots={spots} />)

      expect(
        screen.getByLabelText('Platz Bett 2: belegt von RES-001')
      ).toBeInTheDocument()
    })

    it('sets correct aria-label for unavailable spot', () => {
      const spots = [makeUnavailableSpot()]
      render(<BedGrid spots={spots} />)

      expect(
        screen.getByLabelText('Platz Bett 3: nicht verfügbar')
      ).toBeInTheDocument()
    })

    it('falls back to code when label is null', () => {
      const spots = [makeSpot({ label: null })]
      render(<BedGrid spots={spots} />)

      expect(screen.getByLabelText('Platz S-001: verfügbar')).toBeInTheDocument()
    })
  })

  describe('click handling', () => {
    it('calls onBedClick when clicking an available spot', () => {
      const onBedClick = jest.fn()
      const spot = makeSpot()
      render(<BedGrid spots={[spot]} onBedClick={onBedClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onBedClick).toHaveBeenCalledWith(spot)
    })

    it('does not call onBedClick for unavailable spots', () => {
      const onBedClick = jest.fn()
      const spots = [makeUnavailableSpot()]
      render(<BedGrid spots={spots} onBedClick={onBedClick} />)

      // Unavailable spots don't have button role
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('calls onOccupiedBedClick when clicking an occupied spot', () => {
      const onOccupiedBedClick = jest.fn()
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} onOccupiedBedClick={onOccupiedBedClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onOccupiedBedClick).toHaveBeenCalledWith(spot)
    })

    it('shows popover with resident info when clicking occupied spot', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))

      // Popover should show resident code
      expect(screen.getByText('RES-001')).toBeInTheDocument()
      // Should show profile link
      expect(screen.getByText(/Profil anzeigen/)).toBeInTheDocument()
    })

    it('makes available spots have button role when onBedClick provided', () => {
      const spots = [makeSpot()]
      render(<BedGrid spots={spots} onBedClick={jest.fn()} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('makes occupied spots always have button role (for popover)', () => {
      const spots = [makeOccupiedSpot()]
      render(<BedGrid spots={spots} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports keyboard activation with Enter key', () => {
      const onBedClick = jest.fn()
      const spot = makeSpot()
      render(<BedGrid spots={[spot]} onBedClick={onBedClick} />)

      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter' })
      expect(onBedClick).toHaveBeenCalledWith(spot)
    })

    it('supports keyboard activation with Space key', () => {
      const onBedClick = jest.fn()
      const spot = makeSpot()
      render(<BedGrid spots={[spot]} onBedClick={onBedClick} />)

      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: ' ' })
      expect(onBedClick).toHaveBeenCalledWith(spot)
    })
  })

  describe('popover', () => {
    it('shows close button on popover', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByLabelText('Schliessen')).toBeInTheDocument()
    })

    it('closes popover when close button is clicked', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('RES-001')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Schliessen'))
      // Popover content should be gone (the RES-001 inside the popover)
      // The spot still shows the 3-char code 'RES'
      expect(screen.queryByText('RES-001')).not.toBeInTheDocument()
    })

    it('shows age range in popover when available', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Alter')).toBeInTheDocument()
      expect(screen.getByText('18-25')).toBeInTheDocument()
    })

    it('shows languages in popover when available', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('Sprachen')).toBeInTheDocument()
      expect(screen.getByText('Deutsch, Englisch')).toBeInTheDocument()
    })

    it('links to resident profile', () => {
      const spot = makeOccupiedSpot()
      render(<BedGrid spots={[spot]} />)

      fireEvent.click(screen.getByRole('button'))

      const link = screen.getByText(/Profil anzeigen/)
      expect(link).toHaveAttribute('href', '/residents/res-1')
    })
  })
})

// =============================================================================
// BEDGRIDSUMMARY TESTS
// =============================================================================

describe('BedGridSummary', () => {
  it('renders nothing when total is 0', () => {
    const { container } = render(
      <BedGridSummary occupied={0} available={0} unavailable={0} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows available count', () => {
    render(<BedGridSummary occupied={2} available={3} />)

    expect(screen.getByText('3 frei')).toBeInTheDocument()
  })

  it('renders correct number of dots for small totals', () => {
    const { container } = render(
      <BedGridSummary occupied={2} available={1} unavailable={1} />
    )

    // 4 dots total (2 + 1 + 1), all within the 8 limit
    const dots = container.querySelectorAll('.rounded-sm')
    expect(dots).toHaveLength(4)
  })

  it('caps dots at 8 and shows overflow count', () => {
    render(
      <BedGridSummary occupied={5} available={3} unavailable={4} />
    )

    // Total is 12, so 8 dots + "+4" text
    expect(screen.getByText('+4')).toBeInTheDocument()
  })

  it('uses compact styling when compact prop is true', () => {
    const { container } = render(
      <BedGridSummary occupied={1} available={1} compact />
    )

    const dots = container.querySelectorAll('.w-3.h-3')
    expect(dots.length).toBeGreaterThan(0)
  })
})
