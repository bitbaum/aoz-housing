import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpotActions } from '../SpotActions'

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

vi.mock('@/lib/actions', () => ({
  updateSpot: vi.fn(),
  deleteSpot: vi.fn(),
}))

// Render ConfirmDialog children inline and expose a "Bestätigen" button
// so tests can verify onConfirm wiring without dealing with dialog state.
vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({
    children,
    onConfirm,
    message,
  }: {
    children: React.ReactNode
    onConfirm: () => void
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
    variant?: string
  }) => (
    <div>
      {children}
      <p data-testid="confirm-message">{message}</p>
      <button data-testid="confirm-action" onClick={onConfirm}>
        Bestätigen
      </button>
    </div>
  ),
}))

vi.mock('@/lib/config/crud-actions', () => ({
  DELETE_CONFIRM_CONFIG: {
    title: 'Löschen bestätigen',
    confirmLabel: 'Löschen',
    cancelLabel: 'Abbrechen',
  },
}))

vi.mock('@/lib/constants/labels', () => ({
  UI_LABELS: { delete: 'Löschen' },
  SPOT_ACTIONS_LABELS: {
    setMaintenance: 'In Wartung setzen',
    setAvailable: 'Wieder verfügbar',
    deleteMessage: 'Dieser Platz wird unwiderruflich gelöscht.',
  },
}))

// --- Fixtures ---

const AVAILABLE_SPOT = { id: 'spot-1', type: 'BED', status: 'AVAILABLE', placements: [] }
const MAINTENANCE_SPOT = { id: 'spot-2', type: 'BED', status: 'MAINTENANCE', placements: [] }
const OCCUPIED_SPOT = {
  id: 'spot-3',
  type: 'BED',
  status: 'AVAILABLE',
  placements: [{ status: 'ACTIVE' }],
}
const UNIT_ID = 'unit-abc'

// --- Tests ---

describe('SpotActions', () => {
  // ── AVAILABLE spot (no active placement) ────────────────────────────────

  it('shows the "In Wartung setzen" button for an AVAILABLE spot', () => {
    render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('button', { name: 'In Wartung setzen' })).toBeInTheDocument()
  })

  it('does not show the "Wieder verfügbar" button for an AVAILABLE spot', () => {
    render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.queryByRole('button', { name: 'Wieder verfügbar' })).not.toBeInTheDocument()
  })

  it('puts MAINTENANCE as the hidden status value for the toggle form', () => {
    const { container } = render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    const statusInput = container.querySelector('input[name="status"]') as HTMLInputElement
    expect(statusInput?.value).toBe('MAINTENANCE')
  })

  // ── MAINTENANCE spot (no active placement) ───────────────────────────────

  it('shows the "Wieder verfügbar" button for a MAINTENANCE spot', () => {
    render(<SpotActions spot={MAINTENANCE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('button', { name: 'Wieder verfügbar' })).toBeInTheDocument()
  })

  it('does not show the "In Wartung setzen" button for a MAINTENANCE spot', () => {
    render(<SpotActions spot={MAINTENANCE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.queryByRole('button', { name: 'In Wartung setzen' })).not.toBeInTheDocument()
  })

  it('puts AVAILABLE as the hidden status value for the toggle form', () => {
    const { container } = render(<SpotActions spot={MAINTENANCE_SPOT} housingUnitId={UNIT_ID} />)
    const statusInput = container.querySelector('input[name="status"]') as HTMLInputElement
    expect(statusInput?.value).toBe('AVAILABLE')
  })

  // ── Spot with active placement ───────────────────────────────────────────

  it('hides the status toggle button when the spot has an active placement', () => {
    render(<SpotActions spot={OCCUPIED_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.queryByRole('button', { name: 'In Wartung setzen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Wieder verfügbar' })).not.toBeInTheDocument()
  })

  it('hides the delete button when the spot has an active placement', () => {
    render(<SpotActions spot={OCCUPIED_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()
  })

  it('renders nothing visible when spot is occupied', () => {
    const { container } = render(<SpotActions spot={OCCUPIED_SPOT} housingUnitId={UNIT_ID} />)
    // Only the wrapping div with no visible buttons
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  // ── Delete flow ──────────────────────────────────────────────────────────

  it('shows the delete button for an unoccupied spot', () => {
    render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument()
  })

  it('renders the ConfirmDialog with the correct delete message', () => {
    render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    expect(screen.getByTestId('confirm-message')).toHaveTextContent(
      'Dieser Platz wird unwiderruflich gelöscht.',
    )
  })

  it('calls requestSubmit on the hidden delete form when confirmed', () => {
    render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)

    // Spy on requestSubmit on the hidden form
    const { container } = render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    const hiddenForm = container.querySelector('form.hidden') as HTMLFormElement
    const submitSpy = vi.spyOn(hiddenForm, 'requestSubmit').mockImplementation(() => {})

    // Click the confirm button exposed by our ConfirmDialog mock
    const [, confirmBtn] = screen.getAllByTestId('confirm-action')
    fireEvent.click(confirmBtn)

    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  // ── Hidden field values ──────────────────────────────────────────────────

  it('passes spot id and housingUnitId as hidden inputs in the toggle form', () => {
    const { container } = render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    const idInput = container.querySelector('input[name="id"]') as HTMLInputElement
    const unitInput = container.querySelector('input[name="housingUnitId"]') as HTMLInputElement
    expect(idInput?.value).toBe('spot-1')
    expect(unitInput?.value).toBe('unit-abc')
  })

  it('passes spot id and housingUnitId in the hidden delete form', () => {
    const { container } = render(<SpotActions spot={AVAILABLE_SPOT} housingUnitId={UNIT_ID} />)
    const deleteForm = container.querySelector('form.hidden') as HTMLFormElement
    const idInput = deleteForm.querySelector('input[name="id"]') as HTMLInputElement
    const unitInput = deleteForm.querySelector('input[name="housingUnitId"]') as HTMLInputElement
    expect(idInput?.value).toBe('spot-1')
    expect(unitInput?.value).toBe('unit-abc')
  })
})
