import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransferForm } from '../TransferForm'
import type { UnitWithSpots } from '@/lib/types'

// --- Suppress React 18 warning for Next.js server-action form props ---

const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Invalid value for prop') &&
      args[1] === '`action`'
    )
      return
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

// --- Mocks ---

vi.mock('@/lib/actions', async () => ({
  transferPlacement: vi.fn(),
}))

// Stub TransferUnitSelector so tests stay focused on TransferForm behaviour.
// Renders a plain <select name="targetHousingUnitId"> that the tests can drive.
vi.mock('../TransferUnitSelector', async () => ({
  TransferUnitSelector: ({
    eligibleUnits,
    selectedUnitId,
    onUnitSelect,
  }: {
    eligibleUnits: Array<{ id: string; code: string }>
    selectedUnitId: string
    onUnitSelect: (id: string) => void
  }) => (
    <select
      aria-label="Ziel-Unterkunft"
      name="targetHousingUnitId"
      value={selectedUnitId}
      onChange={(e) => onUnitSelect(e.target.value)}
    >
      <option value="">Bitte wählen...</option>
      {eligibleUnits.map((u) => (
        <option key={u.id} value={u.id}>
          {u.code}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('@/lib/config/placement-spots', async () => ({
  SPOT_TYPE_LABELS: { BED: 'Bett', PRIVATE_ROOM: 'Privatzimmer' },
  SPOT_TYPE_ICONS: { BED: '🛏', PRIVATE_ROOM: '🚪' },
}))

vi.mock('@/lib/constants', async () => ({
  END_REASON_LABELS: {
    CONFLICT: 'Konflikt',
    REQUEST: 'Auf Wunsch',
  },
  END_REASON_DESCRIPTIONS: {
    CONFLICT: 'Konflikte mit Mitbewohnern',
    REQUEST: 'Bewohner hat selbst gebeten',
  },
  PLACEMENT_ACTIONS_LABELS: {
    transferTitle: 'Bewohner verlegen',
    closeBtn: '✕ Schliessen',
    noEligibleUnits: 'Keine geeigneten Ziel-Unterkünfte verfügbar.',
    targetUnitLabel: 'Ziel-Unterkunft *',
    targetSpotLabel: 'Ziel-Platz *',
    selectSpot: 'Platz auswählen',
    selectUnitFirst: 'Zuerst Unterkunft wählen',
    medDocsSpotHint: 'Zeigt Plätze passend zur med. Dokumentation',
    noMedDocsSpotHint: 'Zeigt nur Betten (keine med. Dokumentation)',
    transferReasonLabel: 'Grund für Verlegung *',
    transferReasonHint: 'Wählen Sie den Hauptgrund für die Verlegung',
    transferNotesLabel: 'Notizen',
    transferNotesPlaceholder: 'Optionale Anmerkungen zur Verlegung...',
    summaryLabel: 'Zusammenfassung:',
    transferSummaryWithUnit: (code: string) => `Bewohner wird in ${code} verlegt.`,
    transferSummaryEmpty: 'Wählen Sie eine Ziel-Unterkunft, um die Verlegung zu bestätigen.',
    transferConfirmBtn: 'Verlegen bestätigen',
    transferConfirmBtnPending: 'Wird verlegt...',
    spotsAvailableCount: (n: number) => `${n} Plätze frei`,
  },
  UI_LABELS: { selectPlaceholder: 'Bitte wählen...' },
}))

// --- Fixtures ---

const UNIT_A: UnitWithSpots = {
  id: 'unit-a',
  code: 'A01',
  address: 'Teststr. 1',
  spots: [
    { id: 'spot-bed', type: 'BED', code: 'B1', label: 'Bett 1' },
    { id: 'spot-priv', type: 'PRIVATE_ROOM', code: 'PR1', label: '' },
  ],
}
const UNIT_B: UnitWithSpots = {
  id: 'unit-b',
  code: 'B02',
  address: 'Hauptweg 5',
  spots: [{ id: 'spot-bed-b', type: 'BED', code: 'B2', label: 'Bett 2' }],
}

const BASE_PROPS = {
  placementId: 'placement-111',
  residentId: 'resident-222',
  eligibleUnits: [UNIT_A, UNIT_B],
  eligibleSpotTypes: ['BED'],
  hasMedicalDocumentation: false,
  selectedUnitId: '',
  onUnitSelect: vi.fn(),
  onClose: vi.fn(),
}

function renderForm(overrides = {}) {
  return render(<TransferForm {...BASE_PROPS} {...overrides} />)
}

// --- Tests ---

describe('TransferForm', () => {
  afterEach(() => vi.clearAllMocks())

  // ── Rendering ───────────────────────────────────────────────────────────

  it('renders the title and close button', () => {
    renderForm()
    expect(screen.getByText('Bewohner verlegen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Schliessen/ })).toBeInTheDocument()
  })

  it('renders hidden inputs with correct ids', () => {
    const { container } = renderForm()
    const hidden = container.querySelectorAll('input[type="hidden"]')
    const values = Array.from(hidden).map((el) => (el as HTMLInputElement).value)
    expect(values).toContain('placement-111')
    expect(values).toContain('resident-222')
  })

  it('renders the reason select with options', () => {
    renderForm()
    expect(screen.getByRole('option', { name: 'Konflikt' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Auf Wunsch' })).toBeInTheDocument()
  })

  // ── No eligible units warning ────────────────────────────────────────────

  it('shows the no-eligible-units warning when eligibleUnits is empty', () => {
    renderForm({ eligibleUnits: [] })
    expect(screen.getByText('Keine geeigneten Ziel-Unterkünfte verfügbar.')).toBeInTheDocument()
  })

  it('does not show the warning when eligible units are available', () => {
    renderForm()
    expect(
      screen.queryByText('Keine geeigneten Ziel-Unterkünfte verfügbar.'),
    ).not.toBeInTheDocument()
  })

  // ── Close callback ───────────────────────────────────────────────────────

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderForm({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /Schliessen/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Spot selector state ──────────────────────────────────────────────────

  it('spot select is disabled when no unit is selected', () => {
    const { container } = renderForm({ selectedUnitId: '' })
    const spotSelect = container.querySelector('select[name="targetSpotId"]')!
    expect(spotSelect).toBeDisabled()
  })

  it('spot select is enabled when a unit is selected', () => {
    const { container } = renderForm({ selectedUnitId: 'unit-a' })
    const spotSelect = container.querySelector('select[name="targetSpotId"]')!
    expect(spotSelect).not.toBeDisabled()
  })

  it('shows only spots matching eligibleSpotTypes for the selected unit', () => {
    // eligibleSpotTypes is ['BED'] — PRIVATE_ROOM should not appear as a spot option
    renderForm({ selectedUnitId: 'unit-a', eligibleSpotTypes: ['BED'] })
    expect(screen.getByRole('option', { name: /Bett 1/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /PR1/ })).not.toBeInTheDocument()
  })

  it('shows spots for the selected unit only, not all units', () => {
    renderForm({ selectedUnitId: 'unit-a', eligibleSpotTypes: ['BED'] })
    // unit-b's Bett 2 should not appear
    expect(screen.queryByRole('option', { name: /Bett 2/ })).not.toBeInTheDocument()
  })

  it('uses spot.code as label when spot.label is empty', () => {
    renderForm({ selectedUnitId: 'unit-a', eligibleSpotTypes: ['PRIVATE_ROOM'] })
    // PRIVATE_ROOM spot has label '' so code 'PR1' should be used
    expect(screen.getByRole('option', { name: /PR1/ })).toBeInTheDocument()
  })

  it('shows "Zuerst Unterkunft wählen" placeholder when no unit selected', () => {
    renderForm({ selectedUnitId: '' })
    // The default option text depends on selectedUnitId being falsy
    expect(screen.getByRole('option', { name: 'Zuerst Unterkunft wählen' })).toBeInTheDocument()
  })

  it('shows "Platz auswählen" placeholder when unit is selected', () => {
    renderForm({ selectedUnitId: 'unit-a' })
    expect(screen.getByRole('option', { name: 'Platz auswählen' })).toBeInTheDocument()
  })

  // ── Medical documentation hint ───────────────────────────────────────────

  it('shows med-docs hint when hasMedicalDocumentation is true', () => {
    renderForm({ hasMedicalDocumentation: true })
    expect(screen.getByText('Zeigt Plätze passend zur med. Dokumentation')).toBeInTheDocument()
  })

  it('shows no-med-docs hint when hasMedicalDocumentation is false', () => {
    renderForm({ hasMedicalDocumentation: false })
    expect(screen.getByText('Zeigt nur Betten (keine med. Dokumentation)')).toBeInTheDocument()
  })

  // ── Summary text ─────────────────────────────────────────────────────────

  it('shows the empty summary when no unit is selected', () => {
    renderForm({ selectedUnitId: '' })
    expect(screen.getByText(/Wählen Sie eine Ziel-Unterkunft/)).toBeInTheDocument()
  })

  it('shows the unit-based summary when a unit is selected', () => {
    renderForm({ selectedUnitId: 'unit-a' })
    expect(screen.getByText(/Bewohner wird in A01 verlegt/)).toBeInTheDocument()
  })

  // ── Submit button disabled gate ──────────────────────────────────────────

  it('submit button is disabled when eligibleUnits is empty', () => {
    renderForm({ eligibleUnits: [], selectedUnitId: '' })
    expect(screen.getByRole('button', { name: 'Verlegen bestätigen' })).toBeDisabled()
  })

  it('submit button is disabled when no unit is selected', () => {
    renderForm({ selectedUnitId: '' })
    expect(screen.getByRole('button', { name: 'Verlegen bestätigen' })).toBeDisabled()
  })

  it('submit button is enabled when a unit is selected', () => {
    renderForm({ selectedUnitId: 'unit-a' })
    expect(screen.getByRole('button', { name: 'Verlegen bestätigen' })).toBeEnabled()
  })
})
