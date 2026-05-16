import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

// --- Mocks ---

jest.mock('@/lib/constants', () => ({
  UI_LABELS: {
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    processing: 'Wird verarbeitet...',
  },
}))

// --- Helpers ---

function renderDialog(overrides: {
  onConfirm?: () => Promise<void> | void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
} = {}) {
  const props = {
    title: overrides.title ?? 'Aktion bestätigen',
    message: overrides.message ?? 'Möchten Sie fortfahren?',
    onConfirm: overrides.onConfirm ?? jest.fn(),
    ...(overrides.confirmLabel !== undefined && { confirmLabel: overrides.confirmLabel }),
    ...(overrides.cancelLabel !== undefined && { cancelLabel: overrides.cancelLabel }),
    ...(overrides.variant !== undefined && { variant: overrides.variant }),
  }
  return render(
    <ConfirmDialog {...props}>
      <button>Auslösen</button>
    </ConfirmDialog>
  )
}

function openDialog() {
  fireEvent.click(screen.getByText('Auslösen'))
}

// --- Tests ---

describe('ConfirmDialog', () => {
  afterEach(() => jest.clearAllMocks())

  // ── Initial state ────────────────────────────────────────────────────────

  it('renders the trigger child without showing the modal', () => {
    renderDialog()
    expect(screen.getByText('Auslösen')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('does not show title or message before the trigger is clicked', () => {
    renderDialog()
    expect(screen.queryByText('Aktion bestätigen')).not.toBeInTheDocument()
    expect(screen.queryByText('Möchten Sie fortfahren?')).not.toBeInTheDocument()
  })

  // ── Opening ──────────────────────────────────────────────────────────────

  it('shows title and message after clicking the trigger', () => {
    renderDialog()
    openDialog()
    expect(screen.getByRole('heading', { name: 'Aktion bestätigen' })).toBeInTheDocument()
    expect(screen.getByText('Möchten Sie fortfahren?')).toBeInTheDocument()
  })

  it('shows confirm and cancel buttons after opening', () => {
    renderDialog()
    openDialog()
    expect(screen.getByRole('button', { name: 'Bestätigen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
  })

  // ── Custom labels ────────────────────────────────────────────────────────

  it('uses custom confirmLabel when provided', () => {
    renderDialog({ confirmLabel: 'Löschen' })
    openDialog()
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument()
  })

  it('uses custom cancelLabel when provided', () => {
    renderDialog({ cancelLabel: 'Nein' })
    openDialog()
    expect(screen.getByRole('button', { name: 'Nein' })).toBeInTheDocument()
  })

  // ── Cancel ───────────────────────────────────────────────────────────────

  it('closes the modal when cancel is clicked', () => {
    renderDialog()
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('does NOT call onConfirm when cancel is clicked', () => {
    const onConfirm = jest.fn()
    renderDialog({ onConfirm })
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // ── Confirm ──────────────────────────────────────────────────────────────

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    renderDialog({ onConfirm })
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigen' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  it('closes the modal after onConfirm resolves', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    renderDialog({ onConfirm })
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigen' }))
    await waitFor(() => expect(screen.queryByRole('heading')).not.toBeInTheDocument())
  })

  it('supports synchronous onConfirm (no await)', async () => {
    const onConfirm = jest.fn()  // sync, returns undefined
    renderDialog({ onConfirm })
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Bestätigen' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('heading')).not.toBeInTheDocument())
  })

  // ── Re-open after cancel ─────────────────────────────────────────────────

  it('can be reopened after cancelling', () => {
    renderDialog()
    openDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()

    openDialog()
    expect(screen.getByRole('heading', { name: 'Aktion bestätigen' })).toBeInTheDocument()
  })

  // ── Variant: danger ──────────────────────────────────────────────────────

  it('renders a confirm button in the danger variant without crashing', () => {
    renderDialog({ variant: 'danger', confirmLabel: 'Löschen' })
    openDialog()
    // Button exists and is not disabled (no pending state)
    const btn = screen.getByRole('button', { name: 'Löschen' })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })
})
