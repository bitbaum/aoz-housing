import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlacementConfirm } from '../PlacementConfirm'

// --- Mocks ---

jest.mock('@/lib/constants', () => ({
  MATCHING_LABELS: {
    blocked: 'Blockiert',
    place: 'Platzieren',
    placeLowCompat: 'Platzieren (niedrige Kompatibilität)',
  },
  PLACEMENT_CONFIRM_LABELS: {
    title: 'Platzierung bestätigen',
    prompt: 'Sie sind dabei zu platzieren:',
    resident: 'Bewohner:',
    unit: 'Unterkunft:',
    spot: 'Platz:',
    compatibility: 'Kompatibilität:',
    lowCompatWarning: 'Niedrige Kompatibilität',
    lowCompatMessage: 'Diese Platzierung hat eine niedrige Kompatibilitätsbewertung.',
    notePoints: 'Beachten Sie folgende Punkte:',
    confirmMessage: 'Möchten Sie fortfahren?',
    cancel: 'Abbrechen',
    placing: 'Wird platziert...',
    confirm: 'Jetzt platzieren',
  },
}))

// --- Fixtures ---

const BASE_PROPS = {
  residentCode: 'RES-001',
  unitCode: 'A01',
  fitScore: 80,
  hasConflicts: false,
  action: jest.fn().mockResolvedValue(undefined),
  formData: { residentId: 'res-1', spotId: 'spot-1' },
}

function renderConfirm(
  overrides: Partial<
    typeof BASE_PROPS & { spotLabel?: string; conflicts?: string[]; disabled?: boolean }
  > = {},
) {
  return render(<PlacementConfirm {...BASE_PROPS} {...overrides} />)
}

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: /Platzieren|Blockiert|niedrige/ }))
}

// --- Tests ---

describe('PlacementConfirm', () => {
  afterEach(() => jest.clearAllMocks())

  // ── Trigger button labels ─────────────────────────────────────────────────

  it('shows "Platzieren" when fit score ≥ 50 and no conflicts', () => {
    renderConfirm({ fitScore: 80, hasConflicts: false })
    expect(screen.getByRole('button', { name: 'Platzieren' })).toBeInTheDocument()
  })

  it('shows low-compat label when fit score < 50', () => {
    renderConfirm({ fitScore: 40, hasConflicts: false })
    expect(
      screen.getByRole('button', { name: 'Platzieren (niedrige Kompatibilität)' }),
    ).toBeInTheDocument()
  })

  it('shows "Blockiert" and disables button when hasConflicts is true', () => {
    renderConfirm({ hasConflicts: true })
    const btn = screen.getByRole('button', { name: 'Blockiert' })
    expect(btn).toBeInTheDocument()
    expect(btn).toBeDisabled()
  })

  it('disables the button when disabled prop is true', () => {
    renderConfirm({ disabled: true })
    expect(screen.getByRole('button', { name: 'Platzieren' })).toBeDisabled()
  })

  // ── Modal does not render initially ──────────────────────────────────────

  it('does not show the modal before trigger is clicked', () => {
    renderConfirm()
    expect(
      screen.queryByRole('heading', { name: 'Platzierung bestätigen' }),
    ).not.toBeInTheDocument()
  })

  // ── Modal opens and shows summary ─────────────────────────────────────────

  it('opens the modal when the trigger is clicked', () => {
    renderConfirm()
    openModal()
    expect(screen.getByRole('heading', { name: 'Platzierung bestätigen' })).toBeInTheDocument()
  })

  it('displays residentCode in the summary', () => {
    renderConfirm()
    openModal()
    expect(screen.getByText('RES-001')).toBeInTheDocument()
  })

  it('displays unitCode in the summary', () => {
    renderConfirm()
    openModal()
    expect(screen.getByText('A01')).toBeInTheDocument()
  })

  it('displays spotLabel when provided', () => {
    renderConfirm({ spotLabel: 'Bett 3' })
    openModal()
    expect(screen.getByText('Bett 3')).toBeInTheDocument()
  })

  it('does not display spot row when spotLabel is omitted', () => {
    renderConfirm()
    openModal()
    expect(screen.queryByText('Platz:')).not.toBeInTheDocument()
  })

  it('displays the fitScore percentage', () => {
    renderConfirm({ fitScore: 72 })
    openModal()
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  // ── Low-compat warning ───────────────────────────────────────────────────

  it('shows the low-compat warning when fitScore < 50', () => {
    renderConfirm({ fitScore: 30 })
    openModal()
    expect(screen.getByText(/Niedrige Kompatibilität/)).toBeInTheDocument()
    expect(screen.getByText(/niedrige Kompatibilitätsbewertung/)).toBeInTheDocument()
  })

  it('does not show the low-compat warning when fitScore ≥ 50', () => {
    renderConfirm({ fitScore: 65 })
    openModal()
    expect(screen.queryByText(/Niedrige Kompatibilität/)).not.toBeInTheDocument()
  })

  // ── Conflicts list ───────────────────────────────────────────────────────

  it('shows conflicts list when conflicts array is non-empty', () => {
    renderConfirm({ conflicts: ['Raucher in Nichtraucher-Einheit', 'Rollstuhl benötigt'] })
    openModal()
    expect(screen.getByText(/Beachten Sie folgende Punkte/)).toBeInTheDocument()
    expect(screen.getByText(/Raucher in Nichtraucher-Einheit/)).toBeInTheDocument()
    expect(screen.getByText(/Rollstuhl benötigt/)).toBeInTheDocument()
  })

  it('does not show conflicts section when conflicts is empty', () => {
    renderConfirm({ conflicts: [] })
    openModal()
    expect(screen.queryByText(/Beachten Sie folgende Punkte/)).not.toBeInTheDocument()
  })

  // ── Cancel closes modal ───────────────────────────────────────────────────

  it('closes the modal when cancel is clicked', () => {
    renderConfirm()
    openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(
      screen.queryByRole('heading', { name: 'Platzierung bestätigen' }),
    ).not.toBeInTheDocument()
  })

  it('does NOT call action when cancel is clicked', () => {
    const action = jest.fn()
    renderConfirm({ action })
    openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(action).not.toHaveBeenCalled()
  })

  // ── Confirm calls action with formData ────────────────────────────────────

  it('calls action with FormData containing all formData entries', async () => {
    const action = jest.fn().mockResolvedValue(undefined)
    renderConfirm({ action, formData: { residentId: 'r-99', spotId: 'sp-7' } })
    openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt platzieren' }))

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    const fd: FormData = action.mock.calls[0][0]
    expect(fd.get('residentId')).toBe('r-99')
    expect(fd.get('spotId')).toBe('sp-7')
  })

  it('closes the modal after confirm resolves', async () => {
    const action = jest.fn().mockResolvedValue(undefined)
    renderConfirm({ action })
    openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt platzieren' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Platzierung bestätigen' }),
      ).not.toBeInTheDocument(),
    )
  })

  // ── Blocked trigger cannot open modal ────────────────────────────────────

  it('does not open the modal when the trigger is blocked (hasConflicts=true)', () => {
    renderConfirm({ hasConflicts: true })
    fireEvent.click(screen.getByRole('button', { name: 'Blockiert' }))
    expect(
      screen.queryByRole('heading', { name: 'Platzierung bestätigen' }),
    ).not.toBeInTheDocument()
  })
})
