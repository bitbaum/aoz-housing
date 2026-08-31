import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlacementPanel } from '../PlacementPanel'
import type { CompatibleResident, HousingSpot } from '../types'

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

vi.mock('@/lib/constants', () => ({
  AGE_RANGE_LABELS: { ADULT: '26-40', YOUNG_ADULT: '18-25' },
  LANGUAGE_LABELS: { DE: 'Deutsch', EN: 'Englisch', AR: 'Arabisch' },
  PLACEMENT_PANEL_LABELS: {
    title: 'Bewohner platzieren',
    noResidents: 'Keine unplatzierten Bewohner verfügbar',
    addResident: 'Neuen Bewohner erfassen',
    foundSuffix: 'passende Bewohner gefunden',
    advancedMatching: 'Erweitertes Matching',
    placing: 'Wird platziert...',
    place: 'Platzieren',
    blocked: 'Blockiert',
    compatibilityTitle: 'Kompatibilität:',
  },
  PLACEMENT_CONCERN_LABELS: {
    wheelchairRequired: 'Benötigt Rollstuhlzugang',
    groundFloorRequired: 'Benötigt Erdgeschoss',
    smokerInNonSmokingUnit: 'Raucher in Nichtraucher-Einheit',
  },
  UI_LABELS: { close: 'Schliessen' },
  getLabel: (map: Record<string, string>, key: string) => map[key] ?? key,
}))

vi.mock('@/lib/utils/formatting', () => ({
  getScoreColorClass: () => 'text-score-good',
}))

vi.mock('@/lib/config/thresholds', async () => ({
  ...(await vi.importActual<Record<string, unknown>>('@/lib/config/thresholds')),
  DISPLAY_LIMITS: { languagePreview: 2 },
}))

// --- Fixtures ---

const SPOT = { id: 'spot-1', code: 'B1', label: 'Bett 1' }

function makeResident(overrides: Partial<CompatibleResident> = {}): CompatibleResident {
  return {
    resident: {
      id: 'res-1',
      code: 'RES-001',
      displayName: null,
      ageRange: 'ADULT',
      gender: 'MALE',
      languages: ['DE'],
      socialStyle: 'MODERATE',
      sleepSchedule: 'STANDARD',
      smokingStatus: 'NON_SMOKER',
      noiseTolerance: 3,
      cleanlinessPractice: 3,
      privacyNeed: 3,
    },
    fitScore: 75,
    strengths: [],
    concerns: [],
    ...overrides,
  }
}

interface PanelOverrides {
  isOpen?: boolean
  onClose?: () => void
  spot?: Pick<HousingSpot, 'id' | 'code' | 'label'> | null
  compatibleResidents?: CompatibleResident[]
  onPlaceResident?: (residentId: string, spotId: string) => Promise<void>
  housingUnitId?: string
}

const BASE_PROPS: PanelOverrides = {
  isOpen: true,
  onClose: vi.fn(),
  spot: SPOT,
  compatibleResidents: [],
  onPlaceResident: vi.fn().mockResolvedValue(undefined),
  housingUnitId: 'unit-1',
}

function renderPanel(overrides: PanelOverrides = {}) {
  const props = { ...BASE_PROPS, ...overrides } as Parameters<typeof PlacementPanel>[0]
  return render(<PlacementPanel {...props} />)
}

// --- Tests ---

describe('PlacementPanel', () => {
  afterEach(() => vi.clearAllMocks())

  // ── Closed / null spot ────────────────────────────────────────────────────

  it('renders nothing when isOpen is false', () => {
    const { container } = renderPanel({ isOpen: false })
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when spot is null', () => {
    const { container } = renderPanel({ spot: null })
    expect(container.firstChild).toBeNull()
  })

  // ── Header ────────────────────────────────────────────────────────────────

  it('shows the panel title', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: 'Bewohner platzieren' })).toBeInTheDocument()
  })

  it('shows spot label when available', () => {
    renderPanel({ spot: { id: 'spot-1', code: 'B1', label: 'Bett 1' } })
    expect(screen.getByText('Bett 1')).toBeInTheDocument()
  })

  it('shows spot code when label is null', () => {
    renderPanel({ spot: { id: 'spot-1', code: 'B1', label: null } })
    expect(screen.getByText('B1')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderPanel({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = renderPanel({ onClose })
    // Backdrop is the fixed overlay div before the panel
    const backdrop = container.querySelector('.scrim')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows empty message when compatibleResidents is empty', () => {
    renderPanel({ compatibleResidents: [] })
    expect(screen.getByText('Keine unplatzierten Bewohner verfügbar')).toBeInTheDocument()
  })

  it('shows "add resident" link in empty state', () => {
    renderPanel({ compatibleResidents: [] })
    expect(screen.getByRole('link', { name: 'Neuen Bewohner erfassen' })).toBeInTheDocument()
  })

  // ── Resident list ─────────────────────────────────────────────────────────

  it('shows resident count and found suffix when residents exist', () => {
    renderPanel({ compatibleResidents: [makeResident()] })
    expect(screen.getByText(/1 passende Bewohner gefunden/)).toBeInTheDocument()
  })

  it('renders a row for each compatible resident', () => {
    const residents = [
      makeResident({ resident: { ...makeResident().resident, id: 'r1', code: 'RES-001' } }),
      makeResident({ resident: { ...makeResident().resident, id: 'r2', code: 'RES-002' } }),
    ]
    renderPanel({ compatibleResidents: residents })
    expect(screen.getByText('RES-001')).toBeInTheDocument()
    expect(screen.getByText('RES-002')).toBeInTheDocument()
  })

  it('displays the fitScore percentage for each resident', () => {
    renderPanel({ compatibleResidents: [makeResident({ fitScore: 82 })] })
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('shows age label and languages for the resident', () => {
    renderPanel({
      compatibleResidents: [
        makeResident({
          resident: { ...makeResident().resident, ageRange: 'ADULT', languages: ['DE', 'EN'] },
        }),
      ],
    })
    expect(screen.getByText(/26-40/)).toBeInTheDocument()
    expect(screen.getByText(/Deutsch/)).toBeInTheDocument()
  })

  it('limits language display to DISPLAY_LIMITS.languagePreview (2)', () => {
    renderPanel({
      compatibleResidents: [
        makeResident({ resident: { ...makeResident().resident, languages: ['DE', 'EN', 'AR'] } }),
      ],
    })
    // Only DE and EN should appear (limit=2), AR should not
    expect(screen.queryByText(/Arabisch/)).not.toBeInTheDocument()
  })

  // ── Resident link ─────────────────────────────────────────────────────────

  it('links resident code to the resident detail page', () => {
    renderPanel({ compatibleResidents: [makeResident()] })
    const link = screen.getByRole('link', { name: 'RES-001' })
    expect(link).toHaveAttribute('href', '/residents/res-1')
  })

  // ── Place action ──────────────────────────────────────────────────────────

  it('calls onPlaceResident with residentId and spotId when place is clicked', async () => {
    const onPlaceResident = vi.fn().mockResolvedValue(undefined)
    renderPanel({
      compatibleResidents: [makeResident()],
      onPlaceResident,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Platzieren' }))
    await waitFor(() => expect(onPlaceResident).toHaveBeenCalledWith('res-1', 'spot-1'))
  })

  it('calls onClose after successful placement', async () => {
    const onClose = vi.fn()
    const onPlaceResident = vi.fn().mockResolvedValue(undefined)
    renderPanel({ compatibleResidents: [makeResident()], onPlaceResident, onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Platzieren' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  // ── Blocking concerns → shows "Blockiert" badge ───────────────────────────

  it('shows "Blockiert" badge instead of place button when resident has blocking concern', () => {
    renderPanel({
      compatibleResidents: [makeResident({ concerns: ['Benötigt Rollstuhlzugang'] })],
    })
    expect(screen.getByText('Blockiert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Platzieren' })).not.toBeInTheDocument()
  })

  // ── Non-blocking concern → shows warning text ─────────────────────────────

  it('shows concern warning text when concern is non-blocking', () => {
    renderPanel({
      compatibleResidents: [makeResident({ concerns: ['Raucher in Nichtraucher-Einheit'] })],
    })
    expect(screen.getByText(/Raucher in Nichtraucher-Einheit/)).toBeInTheDocument()
    // Place button should still be visible
    expect(screen.getByRole('button', { name: 'Platzieren' })).toBeInTheDocument()
  })

  // ── Strengths display ─────────────────────────────────────────────────────

  it('shows first strength text when there are no concerns', () => {
    renderPanel({
      compatibleResidents: [
        makeResident({ strengths: ['Ähnlicher Schlafrhythmus'], concerns: [] }),
      ],
    })
    expect(screen.getByText(/Ähnlicher Schlafrhythmus/)).toBeInTheDocument()
  })

  // ── Footer link ───────────────────────────────────────────────────────────

  it('renders advanced matching link pointing to /matching?unit=<housingUnitId>', () => {
    renderPanel({ housingUnitId: 'unit-99' })
    const link = screen.getByRole('link', { name: 'Erweitertes Matching' })
    expect(link).toHaveAttribute('href', '/matching?unit=unit-99')
  })
})
