import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DangerZone, type DangerZoneLabels } from '../DangerZone'

// --- Mocks ---

const mockPush = vi.hoisted(() => vi.fn())
const mockRefresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// --- Fixtures ---

const LABELS: DangerZoneLabels = {
  title: 'Danger Zone',
  description: 'Endgültige Aktion.',
  notEligible: 'Code nicht als Test/Demo markiert.',
  blockerReportTitle: 'Blocker-Report:',
  noDetails: 'Keine Details',
  copyReport: 'Report kopieren',
  copiedToClipboard: 'In Zwischenablage kopiert',
  confirmPlaceholder: 'Bestätigung: DELETE',
  reasonPlaceholder: 'Grund (mind. 10 Zeichen)',
  deleteFailed: 'Löschen fehlgeschlagen',
  deleteSuccess: 'Erfolgreich gelöscht',
  deleteButton: 'Endgültig löschen',
}

const BLOCKER_LABELS: Record<string, string> = {
  placements: 'Platzierungen',
  incidents: 'Vorfälle',
}

const BASE_PROPS = {
  entityId: 'entity-1',
  entityCode: 'TEST-001',
  entityType: 'Resident',
  labels: LABELS,
  blockerLabels: BLOCKER_LABELS,
  onDelete: vi.fn(),
  redirectPath: '/residents',
  ariaId: 'dz-title',
}

function renderDZ(overrides: Partial<typeof BASE_PROPS> = {}) {
  const props = { ...BASE_PROPS, ...overrides }
  return render(<DangerZone {...props} />)
}

// Fill in valid form state (eligible code required separately via entityCode)
function fillValid() {
  fireEvent.change(screen.getByPlaceholderText('Bestätigung: DELETE'), {
    target: { value: 'DELETE' },
  })
  fireEvent.change(screen.getByPlaceholderText('Grund (mind. 10 Zeichen)'), {
    target: { value: 'Längerer Grund für Löschung' },
  })
}

// --- Tests ---

describe('DangerZone', () => {
  afterEach(() => vi.clearAllMocks())

  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders title and description', () => {
    renderDZ()
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
    expect(screen.getByText('Endgültige Aktion.')).toBeInTheDocument()
  })

  it('renders the delete button', () => {
    renderDZ()
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeInTheDocument()
  })

  // ── Eligibility gate ─────────────────────────────────────────────────────

  it('shows the not-eligible message when code does not contain test/demo', () => {
    renderDZ({ entityCode: 'REAL-001' })
    expect(screen.getByText('Code nicht als Test/Demo markiert.')).toBeInTheDocument()
  })

  it('does not show the not-eligible message for a test code', () => {
    renderDZ({ entityCode: 'TEST-001' })
    expect(screen.queryByText('Code nicht als Test/Demo markiert.')).not.toBeInTheDocument()
  })

  it('does not show the not-eligible message for a demo code', () => {
    renderDZ({ entityCode: 'DEMO-99' })
    expect(screen.queryByText('Code nicht als Test/Demo markiert.')).not.toBeInTheDocument()
  })

  it('disables inputs when entity code is not test/demo', () => {
    renderDZ({ entityCode: 'REAL-001' })
    expect(screen.getByPlaceholderText('Bestätigung: DELETE')).toBeDisabled()
    expect(screen.getByPlaceholderText('Grund (mind. 10 Zeichen)')).toBeDisabled()
  })

  it('enables inputs when entity code is test/demo', () => {
    renderDZ()
    expect(screen.getByPlaceholderText('Bestätigung: DELETE')).not.toBeDisabled()
    expect(screen.getByPlaceholderText('Grund (mind. 10 Zeichen)')).not.toBeDisabled()
  })

  // ── Delete button disabled gate ──────────────────────────────────────────

  it('delete button is disabled when code is not test/demo', () => {
    renderDZ({ entityCode: 'REAL-001' })
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeDisabled()
  })

  it('delete button is disabled when confirmation is wrong', () => {
    renderDZ()
    fireEvent.change(screen.getByPlaceholderText('Bestätigung: DELETE'), {
      target: { value: 'delete' },
    })
    fireEvent.change(screen.getByPlaceholderText('Grund (mind. 10 Zeichen)'), {
      target: { value: 'Langer genug Grund' },
    })
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeDisabled()
  })

  it('delete button is disabled when reason is shorter than 10 chars', () => {
    renderDZ()
    fireEvent.change(screen.getByPlaceholderText('Bestätigung: DELETE'), {
      target: { value: 'DELETE' },
    })
    fireEvent.change(screen.getByPlaceholderText('Grund (mind. 10 Zeichen)'), {
      target: { value: 'kurz' },
    })
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeDisabled()
  })

  it('delete button is enabled with valid confirmation and reason', () => {
    renderDZ()
    fillValid()
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).not.toBeDisabled()
  })

  // ── Delete flow — success ─────────────────────────────────────────────────

  it('calls onDelete with entityId, confirmation, and reason', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: true })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
    expect(onDelete).toHaveBeenCalledWith('entity-1', 'DELETE', 'Längerer Grund für Löschung')
  })

  it('shows success message after successful delete', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: true })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich gelöscht')
  })

  it('calls router.push with redirectPath after successful delete', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: true })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/residents'))
  })

  it('calls router.refresh() after successful delete', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: true })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Delete flow — failure ─────────────────────────────────────────────────

  it('shows error message on failure and does NOT redirect', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: false, error: 'DB-Fehler' })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByRole('status')).toHaveTextContent('DB-Fehler')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('falls back to labels.deleteFailed when error is absent', async () => {
    const onDelete = vi.fn().mockResolvedValue({ success: false })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByRole('status')).toHaveTextContent('Löschen fehlgeschlagen')
  })

  // ── Blocker report ────────────────────────────────────────────────────────

  it('shows blocker report section when onDelete returns blockerReport', async () => {
    const onDelete = vi.fn().mockResolvedValue({
      success: false,
      error: 'Hat aktive Daten',
      blockerReport: { placements: 2, incidents: 0 },
    })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByText(/Blocker-Report:/)).toBeInTheDocument()
    // Only entries with count > 0 appear
    expect(screen.getByText(/Platzierungen: 2/)).toBeInTheDocument()
    expect(screen.queryByText(/Vorfälle/)).not.toBeInTheDocument()
  })

  it('shows "Keine Details" when all blocker counts are zero', async () => {
    const onDelete = vi.fn().mockResolvedValue({
      success: false,
      blockerReport: { placements: 0, incidents: 0 },
    })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByText(/Keine Details/)).toBeInTheDocument()
  })

  it('shows the "Report kopieren" button in the blocker report', async () => {
    const onDelete = vi.fn().mockResolvedValue({
      success: false,
      blockerReport: { placements: 1 },
    })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByText('Report kopieren'))
  })

  // ── Copy-to-clipboard ────────────────────────────────────────────────────

  it('writes the blocker report to clipboard and shows confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const onDelete = vi.fn().mockResolvedValue({
      success: false,
      blockerReport: { placements: 3 },
    })
    renderDZ({ onDelete })
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))

    await waitFor(() => screen.getByText('Report kopieren'))

    await act(async () => {
      fireEvent.click(screen.getByText('Report kopieren'))
    })

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toContain('Resident')
    expect(writeText.mock.calls[0][0]).toContain('TEST-001')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('In Zwischenablage kopiert')
    })
  })

  // ── State reset between attempts ─────────────────────────────────────────

  it('clears previous feedback when a new delete attempt starts', async () => {
    const onDelete = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: 'Erster Fehler' })
      .mockResolvedValueOnce({ success: true })

    renderDZ({ onDelete })
    fillValid()

    // First attempt fails
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))
    await waitFor(() => screen.getByRole('status'))
    expect(screen.getByRole('status')).toHaveTextContent('Erster Fehler')

    // Second attempt succeeds — error must clear before success shows
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Erfolgreich gelöscht'),
    )
  })
})
