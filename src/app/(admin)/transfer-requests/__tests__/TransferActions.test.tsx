import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TransferActions } from '../TransferActions'

// --- Mocks ---

const mockApprove = jest.fn()
const mockDeny = jest.fn()
jest.mock('@/lib/actions/transfers', () => ({
  approveTransferRequest: (...args: unknown[]) => mockApprove(...args),
  denyTransferRequest: (...args: unknown[]) => mockDeny(...args),
}))

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

jest.mock('@/lib/constants', () => ({
  TRANSFER_ACTION_LABELS: {
    notesPlaceholder: 'Notiz (optional)',
    approve: 'Genehmigen',
    approveAndTransfer: 'Genehmigen & verlegen',
    deny: 'Ablehnen',
    processing: 'Wird bearbeitet...',
    success: 'Erfolgreich bearbeitet',
    successExecuted: 'Genehmigt — Verlegung wurde durchgeführt',
    successApprovedOnly: 'Genehmigt — Verlegung noch nicht durchgeführt',
    completeTransferHint: 'Zieleinheit über die Bewohnerseite wählen und Verlegung abschliessen:',
    completeTransferLink: 'Verlegung durchführen',
  },
}))

// --- Helpers ---

function renderActions(
  props: Partial<{ requestId: string; residentId: string; hasTargetUnit: boolean }> = {}
) {
  return render(
    <TransferActions
      requestId={props.requestId ?? 'req-1'}
      residentId={props.residentId ?? 'res-1'}
      hasTargetUnit={props.hasTargetUnit ?? false}
    />
  )
}

function mockSuccess(executed = false) {
  mockApprove.mockResolvedValue({ success: true, executed })
  mockDeny.mockResolvedValue({ success: true, executed: false })
}

function mockError(message = 'Fehler aufgetreten') {
  mockApprove.mockResolvedValue({ success: false, error: message })
  mockDeny.mockResolvedValue({ success: false, error: message })
}

// --- Tests ---

describe('TransferActions', () => {
  afterEach(() => jest.clearAllMocks())

  // ── Rendering ───────────────────────────────────────────────────────────

  it('renders the notes textarea, approve and deny buttons', () => {
    renderActions()
    expect(screen.getByPlaceholderText('Notiz (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Genehmigen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ablehnen' })).toBeInTheDocument()
  })

  it('labels the approve button "Genehmigen & verlegen" when a target unit is set', () => {
    renderActions({ hasTargetUnit: true })
    expect(screen.getByRole('button', { name: 'Genehmigen & verlegen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Genehmigen' })).not.toBeInTheDocument()
  })

  // ── Approve flow ────────────────────────────────────────────────────────

  it('calls approveTransferRequest with requestId when approve is clicked', async () => {
    mockSuccess()
    renderActions({ requestId: 'req-abc' })

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => expect(mockApprove).toHaveBeenCalledTimes(1))
    expect(mockApprove).toHaveBeenCalledWith({ requestId: 'req-abc', staffNotes: undefined })
  })

  it('includes staffNotes in the approve call when typed', async () => {
    mockSuccess()
    renderActions({ requestId: 'req-abc' })

    fireEvent.change(screen.getByPlaceholderText('Notiz (optional)'), {
      target: { value: 'Genehmigt nach Rücksprache' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => expect(mockApprove).toHaveBeenCalledTimes(1))
    expect(mockApprove).toHaveBeenCalledWith({
      requestId: 'req-abc',
      staffNotes: 'Genehmigt nach Rücksprache',
    })
  })

  it('shows success message after successful approve', async () => {
    mockSuccess()
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich bearbeitet')
    })
    // Form is replaced by success message
    expect(screen.queryByRole('button', { name: 'Genehmigen' })).not.toBeInTheDocument()
  })

  it('shows executed message and no follow-up link when the transfer was executed', async () => {
    mockSuccess(true)
    renderActions({ hasTargetUnit: true })

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen & verlegen' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Genehmigt — Verlegung wurde durchgeführt'
      )
    })
    expect(screen.queryByRole('link', { name: 'Verlegung durchführen' })).not.toBeInTheDocument()
  })

  it('shows a link to complete the transfer when approval did not execute it', async () => {
    mockSuccess(false)
    renderActions({ residentId: 'res-42' })

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => screen.getByRole('status'))
    const link = screen.getByRole('link', { name: 'Verlegung durchführen' })
    expect(link).toHaveAttribute('href', '/residents/res-42')
  })

  it('calls router.refresh() after successful approve', async () => {
    mockSuccess()
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Deny flow ───────────────────────────────────────────────────────────

  it('calls denyTransferRequest with requestId when deny is clicked', async () => {
    mockSuccess()
    renderActions({ requestId: 'req-xyz' })

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => expect(mockDeny).toHaveBeenCalledTimes(1))
    expect(mockDeny).toHaveBeenCalledWith({ requestId: 'req-xyz', staffNotes: undefined })
  })

  it('shows success message after successful deny', async () => {
    mockSuccess()
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich bearbeitet')
    })
  })

  it('calls router.refresh() after successful deny', async () => {
    mockSuccess()
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('disables both buttons and shows processing label while loading', async () => {
    let resolve: (v: { success: boolean }) => void
    mockApprove.mockReturnValue(new Promise((r) => { resolve = r }))

    renderActions()
    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Wird bearbeitet...' })).toHaveLength(2)
    })
    expect(screen.getAllByRole('button')[0]).toBeDisabled()
    expect(screen.getAllByRole('button')[1]).toBeDisabled()

    await act(async () => { resolve!({ success: true }) })
  })

  // ── Error handling ───────────────────────────────────────────────────────

  it('shows error alert and keeps the form visible on failure', async () => {
    mockError('Anfrage bereits bearbeitet')
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Anfrage bereits bearbeitet')
    })
    // Buttons remain
    expect(screen.getByRole('button', { name: 'Genehmigen' })).toBeInTheDocument()
  })

  it('does NOT call router.refresh() on failure', async () => {
    mockError()
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => screen.getByRole('alert'))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('clears a previous error when a new action is started', async () => {
    // First attempt fails
    mockApprove.mockResolvedValueOnce({ success: false, error: 'Erster Fehler' })
    renderActions()

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))
    await waitFor(() => screen.getByRole('alert'))

    // Second attempt succeeds
    mockApprove.mockResolvedValueOnce({ success: true })
    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
