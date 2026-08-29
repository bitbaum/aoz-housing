import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResidentBedPopover, getActivePlacement } from '../ResidentBedPopover'
import type { HousingSpot, HousingPlacement } from '../types'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

jest.mock('@/lib/constants', () => ({
  AGE_RANGE_LABELS: { YOUNG_ADULT: '18-25', ADULT: '26-40', MIDDLE_AGED: '41-60', SENIOR: '60+' },
  LANGUAGE_LABELS: { de: 'Deutsch', en: 'Englisch', ar: 'Arabisch' },
  BED_GRID_LABELS: {
    age: 'Alter',
    languages: 'Sprachen',
    showProfile: 'Profil anzeigen →',
  },
  UI_LABELS: { close: 'Schliessen' },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] ?? key,
}))

jest.mock('@/lib/config/thresholds', () => ({
  DISPLAY_LIMITS: { languagePreview: 2 },
}))

// --- Helpers ---

function makePlacement(residentId: string, status = 'ACTIVE'): HousingPlacement {
  return {
    id: `pl-${residentId}`,
    status,
    resident: {
      id: residentId,
      code: `RES-${residentId}`,
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
  }
}

function makeSpot(overrides: Partial<HousingSpot> & { id: string }): HousingSpot {
  return {
    id: overrides.id,
    code: overrides.code ?? `SPOT-${overrides.id}`,
    label: overrides.label ?? null,
    type: overrides.type ?? 'BED',
    status: overrides.status ?? 'AVAILABLE',
    requiresMedicalDocs: overrides.requiresMedicalDocs ?? false,
    parentSpotId: overrides.parentSpotId ?? null,
    placements: overrides.placements ?? [],
  }
}

const POSITION = { x: 200, y: 150 }

function renderPopover(spot: HousingSpot, onClose = jest.fn()) {
  render(<ResidentBedPopover spot={spot} position={POSITION} onClose={onClose} />)
  return { onClose }
}

// --- Tests ---

describe('getActivePlacement', () => {
  it('returns ACTIVE placement', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1', 'ACTIVE')] })
    expect(getActivePlacement(spot)?.status).toBe('ACTIVE')
  })

  it('returns undefined when no placements', () => {
    const spot = makeSpot({ id: 's1', placements: [] })
    expect(getActivePlacement(spot)).toBeUndefined()
  })

  it('returns undefined when only non-ACTIVE placements exist', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1', 'ENDED')] })
    expect(getActivePlacement(spot)).toBeUndefined()
  })

  it('returns first ACTIVE when multiple placements exist', () => {
    const spot = makeSpot({
      id: 's1',
      placements: [makePlacement('r1', 'ENDED'), makePlacement('r2', 'ACTIVE')],
    })
    expect(getActivePlacement(spot)?.resident.id).toBe('r2')
  })
})

describe('ResidentBedPopover', () => {
  // ── Renders nothing without active placement ──────────────────────────────

  it('renders nothing when spot has no active placement', () => {
    const spot = makeSpot({ id: 's1', placements: [] })
    const { container } = render(
      <ResidentBedPopover spot={spot} position={POSITION} onClose={jest.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when only ENDED placement exists', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1', 'ENDED')] })
    const { container } = render(
      <ResidentBedPopover spot={spot} position={POSITION} onClose={jest.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  // ── Header ────────────────────────────────────────────────────────────────

  it('shows resident code in header', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('abc')] })
    renderPopover(spot)
    expect(screen.getByText('RES-abc')).toBeInTheDocument()
  })

  it('shows spot label in header when label is set', () => {
    const spot = makeSpot({ id: 's1', label: 'Bett 1', placements: [makePlacement('r1')] })
    renderPopover(spot)
    expect(screen.getByText('Bett 1')).toBeInTheDocument()
  })

  it('falls back to spot code when label is null', () => {
    const spot = makeSpot({
      id: 's1',
      code: 'B-01',
      label: null,
      placements: [makePlacement('r1')],
    })
    renderPopover(spot)
    expect(screen.getByText('B-01')).toBeInTheDocument()
  })

  it('shows last 3 chars of resident code in avatar', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('xyz')] })
    renderPopover(spot)
    // resident code is RES-xyz → last 3 chars = 'xyz'
    expect(screen.getByText('xyz')).toBeInTheDocument()
  })

  // ── Close button ──────────────────────────────────────────────────────────

  it('renders close button with aria-label', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    renderPopover(spot)
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    const { onClose } = renderPopover(spot)
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Age row ───────────────────────────────────────────────────────────────

  it('shows age row when resident has ageRange', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    renderPopover(spot)
    expect(screen.getByText('Alter')).toBeInTheDocument()
    expect(screen.getByText('26-40')).toBeInTheDocument()
  })

  it('hides age row when ageRange is null', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    // Override ageRange to null
    spot.placements[0].resident.ageRange = null as never
    renderPopover(spot)
    expect(screen.queryByText('Alter')).not.toBeInTheDocument()
  })

  // ── Languages row ─────────────────────────────────────────────────────────

  it('shows languages row when resident has languages', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    renderPopover(spot)
    expect(screen.getByText('Sprachen')).toBeInTheDocument()
    expect(screen.getByText('Deutsch')).toBeInTheDocument()
  })

  it('hides languages row when languages array is empty', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    spot.placements[0].resident.languages = []
    renderPopover(spot)
    expect(screen.queryByText('Sprachen')).not.toBeInTheDocument()
  })

  it('shows multiple languages joined by comma', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    spot.placements[0].resident.languages = ['de', 'en']
    renderPopover(spot)
    expect(screen.getByText('Deutsch, Englisch')).toBeInTheDocument()
  })

  it('truncates languages at languagePreview limit (2)', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    spot.placements[0].resident.languages = ['de', 'en', 'ar']
    renderPopover(spot)
    expect(screen.getByText('Deutsch, Englisch')).toBeInTheDocument()
    expect(screen.queryByText(/Arabisch/)).not.toBeInTheDocument()
  })

  // ── Footer link ───────────────────────────────────────────────────────────

  it('shows profile link pointing to resident', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('res-99')] })
    renderPopover(spot)
    expect(screen.getByRole('link', { name: 'Profil anzeigen →' })).toHaveAttribute(
      'href',
      '/residents/res-99',
    )
  })

  it('calls onClose when profile link clicked', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    const { onClose } = renderPopover(spot)
    fireEvent.click(screen.getByRole('link', { name: 'Profil anzeigen →' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Position styling ──────────────────────────────────────────────────────

  it('applies position styles from props', () => {
    const spot = makeSpot({ id: 's1', placements: [makePlacement('r1')] })
    const { container } = render(
      <ResidentBedPopover spot={spot} position={{ x: 300, y: 200 }} onClose={jest.fn()} />,
    )
    const popover = container.firstChild as HTMLElement
    // left = max(8, 300 - 128) = 172
    expect(popover.style.left).toBe('172px')
    expect(popover.style.top).toBe('200px')
  })
})
