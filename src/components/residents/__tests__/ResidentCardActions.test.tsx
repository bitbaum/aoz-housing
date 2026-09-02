import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResidentCardActions } from '../ResidentCardActions'

// --- Mocks ---

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', async () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockArchive = vi.fn()
const mockRestore = vi.fn()
vi.mock('@/lib/actions', async () => ({
  archiveResident: (...args: unknown[]) => mockArchive(...args),
  restoreResident: (...args: unknown[]) => mockRestore(...args),
}))

vi.mock('@/lib/config/crud-actions', async () => ({
  CRUD_ACTIONS: {
    edit: { label: 'Bearbeiten' },
    duplicate: { label: 'Duplizieren' },
    delete: { label: 'Löschen' },
  },
  ACTION_ICONS: {
    ellipsis: 'M5 12h14',
    pencil: 'M16 3l5 5L8 21H3v-5L16 3z',
    copy: 'M8 4H4v16h12v-4',
    trash: 'M3 6h18M8 6V4h8v2',
  },
}))

vi.mock('@/lib/constants/labels', async () => ({
  UI_LABELS: { actions: 'Aktionen' },
}))

// --- Helpers ---

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Aktionen' }))
}

// --- Tests ---

describe('ResidentCardActions', () => {
  beforeAll(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })
  afterAll(() => vi.restoreAllMocks())
  afterEach(() => vi.clearAllMocks())

  // ── Trigger renders ──────────────────────────────────────────────────────

  it('renders the actions trigger button', () => {
    render(<ResidentCardActions residentId="res-1" status="ACTIVE" />)
    expect(screen.getByRole('button', { name: 'Aktionen' })).toBeInTheDocument()
  })

  it('renders nothing when writing is disabled', () => {
    render(<ResidentCardActions residentId="res-1" status="ACTIVE" canWrite={false} />)
    expect(screen.queryByRole('button', { name: 'Aktionen' })).not.toBeInTheDocument()
  })

  it('does not show menu items before trigger is clicked', () => {
    render(<ResidentCardActions residentId="res-1" status="ACTIVE" />)
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
  })

  // ── Edit ─────────────────────────────────────────────────────────────────

  it('navigates to the resident edit page when edit is clicked', () => {
    render(<ResidentCardActions residentId="res-42" status="ACTIVE" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Bearbeiten/ }))
    expect(mockPush).toHaveBeenCalledWith('/residents/res-42/edit')
  })

  // ── Archive (non-EXITED → archive) ───────────────────────────────────────

  it('shows "Archivieren" label when status is not EXITED', () => {
    render(<ResidentCardActions residentId="res-1" status="ACTIVE" />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Archivieren/ })).toBeInTheDocument()
  })

  it('calls archiveResident with the resident id when Archivieren is clicked', async () => {
    mockArchive.mockResolvedValue({ success: true })
    render(<ResidentCardActions residentId="res-7" status="ACTIVE" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Archivieren/ }))
    await waitFor(() => expect(mockArchive).toHaveBeenCalledWith('res-7'))
    expect(mockRestore).not.toHaveBeenCalled()
  })

  it('calls router.refresh() after successful archive', async () => {
    mockArchive.mockResolvedValue({ success: true })
    render(<ResidentCardActions residentId="res-7" status="ACTIVE" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Archivieren/ }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Restore (EXITED → restore) ───────────────────────────────────────────

  it('shows "Wiederherstellen" label when status is EXITED', () => {
    render(<ResidentCardActions residentId="res-1" status="EXITED" />)
    openMenu()
    expect(screen.getByRole('menuitem', { name: /Wiederherstellen/ })).toBeInTheDocument()
  })

  it('calls restoreResident with the resident id when Wiederherstellen is clicked', async () => {
    mockRestore.mockResolvedValue({ success: true })
    render(<ResidentCardActions residentId="res-3" status="EXITED" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Wiederherstellen/ }))
    await waitFor(() => expect(mockRestore).toHaveBeenCalledWith('res-3'))
    expect(mockArchive).not.toHaveBeenCalled()
  })

  it('calls router.refresh() after successful restore', async () => {
    mockRestore.mockResolvedValue({ success: true })
    render(<ResidentCardActions residentId="res-3" status="EXITED" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Wiederherstellen/ }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  // ── Failure — no refresh ─────────────────────────────────────────────────

  it('does NOT call router.refresh() when archive fails', async () => {
    mockArchive.mockResolvedValue({ success: false, error: 'Fehler' })
    render(<ResidentCardActions residentId="res-1" status="ACTIVE" />)
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: /Archivieren/ }))
    await waitFor(() => expect(mockArchive).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
