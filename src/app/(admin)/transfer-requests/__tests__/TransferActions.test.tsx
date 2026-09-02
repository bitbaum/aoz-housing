import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TransferActions } from '../TransferActions'

// --- Mocks ---

const mockApprove = vi.fn()
const mockDeny = vi.fn()
vi.mock('@/lib/actions/transfers', async () => ({
  approveTransferRequest: (...args: unknown[]) => mockApprove(...args),
  denyTransferRequest: (...args: unknown[]) => mockDeny(...args),
}))

const mockRefresh = vi.fn()
vi.mock('next/navigation', async () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/lib/constants', async () => ({
  TRANSFER_ACTION_LABELS: {
    notesPlaceholder: 'Notiz (optional)',
    approve: 'Genehmigen',
    deny: 'Ablehnen',
    processing: 'Wird bearbeitet...',
    success: 'Erfolgreich bearbeitet',
  },
}))

// --- Helpers ---

function mockSuccess() {
  mockApprove.mockResolvedValue({ success: true })
  mockDeny.mockResolvedValue({ success: true })
}

function mockError(message = 'Fehler aufgetreten') {
  mockApprove.mockResolvedValue({ success: false, error: message })
  mockDeny.mockResolvedValue({ success: false, error: message })
}

// --- Tests ---

describe('TransferActions', () => {
  afterEach(() => vi.clearAllMocks())

  // ── Rendering ───────────────────────────────────────────────────────────

  it('renders the notes textarea, approve and deny buttons', () => {
    render(<TransferActions requestId="req-1" residentId="res-1" />)
    expect(screen.getByPlaceholderText('Notiz (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Genehmigen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ablehnen' })).toBeInTheDocument()
  })

  // ── Approve flow ────────────────────────────────────────────────────────

  it('calls approveTransferRequest with requestId when approve is clicked', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-abc" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => expect(mockApprove).toHaveBeenCalledTimes(1))
    expect(mockApprove).toHaveBeenCalledWith({ requestId: 'req-abc', staffNotes: undefined })
  })

  it('includes staffNotes in the approve call when typed', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-abc" residentId="res-1" />)

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
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich bearbeitet')
    })
    // Form is replaced by success message
    expect(screen.queryByRole('button', { name: 'Genehmigen' })).not.toBeInTheDocument()
  })

  it('calls router.refresh() after successful approve', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Deny flow ───────────────────────────────────────────────────────────

  it('calls denyTransferRequest with requestId when deny is clicked', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-xyz" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => expect(mockDeny).toHaveBeenCalledTimes(1))
    expect(mockDeny).toHaveBeenCalledWith({ requestId: 'req-xyz', staffNotes: undefined })
  })

  it('shows success message after successful deny', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich bearbeitet')
    })
  })

  it('calls router.refresh() after successful deny', async () => {
    mockSuccess()
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Ablehnen' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Loading state ────────────────────────────────────────────────────────

  it('disables both buttons and shows processing label while loading', async () => {
    let resolve: (v: { success: boolean }) => void
    mockApprove.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )

    render(<TransferActions requestId="req-1" residentId="res-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Wird bearbeitet...' })).toHaveLength(2)
    })
    expect(screen.getAllByRole('button')[0]).toBeDisabled()
    expect(screen.getAllByRole('button')[1]).toBeDisabled()

    await act(async () => {
      resolve!({ success: true })
    })
  })

  // ── Error handling ───────────────────────────────────────────────────────

  it('shows error alert and keeps the form visible on failure', async () => {
    mockError('Anfrage bereits bearbeitet')
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Anfrage bereits bearbeitet')
    })
    // Buttons remain
    expect(screen.getByRole('button', { name: 'Genehmigen' })).toBeInTheDocument()
  })

  it('does NOT call router.refresh() on failure', async () => {
    mockError()
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => screen.getByRole('alert'))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('clears a previous error when a new action is started', async () => {
    // First attempt fails
    mockApprove.mockResolvedValueOnce({ success: false, error: 'Erster Fehler' })
    render(<TransferActions requestId="req-1" residentId="res-1" />)

    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))
    await waitFor(() => screen.getByRole('alert'))

    // Second attempt succeeds
    mockApprove.mockResolvedValueOnce({ success: true })
    fireEvent.click(screen.getByRole('button', { name: 'Genehmigen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
