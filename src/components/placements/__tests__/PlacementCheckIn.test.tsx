import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlacementCheckIn } from '../PlacementCheckIn'

// --- Mocks ---

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockCreateQuickCheckIn = jest.fn()
jest.mock('@/lib/actions/satisfaction', () => ({
  createQuickCheckIn: (...args: unknown[]) => mockCreateQuickCheckIn(...args),
}))

jest.mock('@/lib/constants/labels', () => ({
  PLACEMENT_LIST_LABELS: {
    checkInSaved: 'Gespeichert ✓',
    checkInStart: 'Check-in starten',
    checkInNone: 'Noch kein Check-in',
    checkInCapture: 'Erfassen →',
    checkInUpdate: 'Check-in aktualisieren',
    checkInOverdue: 'Überfällig!',
  },
}))

// --- Helpers ---

const BASE_PROPS = {
  placementId: 'placement-1',
  isOverdue: false,
  daysSinceCheckIn: null,
  lastSatisfaction: null,
  weeksSinceStart: 4,
  checkInCount: 3,
}

function renderCheckIn(overrides = {}) {
  return render(<PlacementCheckIn {...BASE_PROPS} {...overrides} />)
}

// --- Tests ---

describe('PlacementCheckIn', () => {
  afterEach(() => jest.clearAllMocks())

  // ── View: no check-in, not overdue ──────────────────────────────────────

  it('shows placeholder when no check-in and not overdue', () => {
    renderCheckIn({ lastSatisfaction: null, isOverdue: false })
    expect(screen.getByText('Noch kein Check-in')).toBeInTheDocument()
    expect(screen.getByText('Erfassen →')).toBeInTheDocument()
  })

  it('does not show the emoji tapper in placeholder state', () => {
    renderCheckIn({ lastSatisfaction: null, isOverdue: false })
    expect(screen.queryByTitle('1/5')).not.toBeInTheDocument()
  })

  it('clicking the placeholder reveals the emoji tapper', () => {
    renderCheckIn({ lastSatisfaction: null, isOverdue: false })
    fireEvent.click(screen.getByTitle('Check-in starten'))
    expect(screen.getByTitle('1/5')).toBeInTheDocument()
    expect(screen.getByTitle('5/5')).toBeInTheDocument()
  })

  // ── View: has recent check-in, not overdue ───────────────────────────────

  it('shows last satisfaction emoji and days when recently checked in', () => {
    renderCheckIn({ lastSatisfaction: 4, isOverdue: false, daysSinceCheckIn: 3 })
    expect(screen.getByText('🙂')).toBeInTheDocument()
    expect(screen.getByText('vor 3d')).toBeInTheDocument()
  })

  it('clicking the recent check-in button reveals the emoji tapper', () => {
    renderCheckIn({ lastSatisfaction: 4, isOverdue: false, daysSinceCheckIn: 3 })
    fireEvent.click(screen.getByTitle('Check-in aktualisieren'))
    expect(screen.getByTitle('1/5')).toBeInTheDocument()
  })

  // ── View: overdue — tapper shown immediately ─────────────────────────────

  it('shows the emoji tapper immediately when check-in is overdue', () => {
    renderCheckIn({ isOverdue: true })
    expect(screen.getByText('Überfällig!')).toBeInTheDocument()
    expect(screen.getByTitle('1/5')).toBeInTheDocument()
  })

  it('shows all five emoji buttons in the tapper', () => {
    renderCheckIn({ isOverdue: true })
    ;['1/5', '2/5', '3/5', '4/5', '5/5'].forEach((title) => {
      expect(screen.getByTitle(title)).toBeInTheDocument()
    })
  })

  it('shows previous emoji summary when last satisfaction is set in overdue view', () => {
    renderCheckIn({ isOverdue: true, lastSatisfaction: 3, daysSinceCheckIn: 10 })
    expect(screen.getByText(/Letzter:/)).toBeInTheDocument()
  })

  // ── Low rating (≤ 3): redirect to full check-in form ────────────────────

  it('pushes to the full check-in page when rating 1 is tapped', () => {
    renderCheckIn({ isOverdue: true })
    fireEvent.click(screen.getByTitle('1/5'))
    // The tapped rating travels to the full form, so nobody picks it twice.
    expect(mockPush).toHaveBeenCalledWith('/placements/placement-1/checkin?rating=1')
    expect(mockCreateQuickCheckIn).not.toHaveBeenCalled()
  })

  it('pushes to the full check-in page when rating 2 is tapped', () => {
    renderCheckIn({ isOverdue: true })
    fireEvent.click(screen.getByTitle('2/5'))
    // The tapped rating travels to the full form, so nobody picks it twice.
    expect(mockPush).toHaveBeenCalledWith('/placements/placement-1/checkin?rating=2')
  })

  it('pushes to the full check-in page when rating 3 is tapped', () => {
    renderCheckIn({ isOverdue: true })
    fireEvent.click(screen.getByTitle('3/5'))
    // The tapped rating travels to the full form, so nobody picks it twice.
    expect(mockPush).toHaveBeenCalledWith('/placements/placement-1/checkin?rating=3')
  })

  // ── High rating (4–5): quick save ───────────────────────────────────────

  it('calls createQuickCheckIn when rating 4 is tapped', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true })

    fireEvent.click(screen.getByTitle('4/5'))

    await waitFor(() => expect(mockCreateQuickCheckIn).toHaveBeenCalledTimes(1))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls createQuickCheckIn when rating 5 is tapped', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true })

    fireEvent.click(screen.getByTitle('5/5'))

    await waitFor(() => expect(mockCreateQuickCheckIn).toHaveBeenCalledTimes(1))
  })

  it('passes INITIAL check-in type when checkInCount is 0', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true, checkInCount: 0, weeksSinceStart: 2 })

    fireEvent.click(screen.getByTitle('5/5'))

    await waitFor(() => expect(mockCreateQuickCheckIn).toHaveBeenCalledWith({
      placementId: 'placement-1',
      overallSatisfaction: 5,
      checkInType: 'INITIAL',
      weekNumber: 2,
    }))
  })

  it('passes REGULAR check-in type when checkInCount is > 0', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true, checkInCount: 5, weeksSinceStart: 8 })

    fireEvent.click(screen.getByTitle('4/5'))

    await waitFor(() => expect(mockCreateQuickCheckIn).toHaveBeenCalledWith({
      placementId: 'placement-1',
      overallSatisfaction: 4,
      checkInType: 'REGULAR',
      weekNumber: 8,
    }))
  })

  // ── Success state ────────────────────────────────────────────────────────

  it('shows saved view with the tapped emoji after successful quick check-in', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true })

    fireEvent.click(screen.getByTitle('4/5'))

    await waitFor(() => {
      expect(screen.getByText('Gespeichert ✓')).toBeInTheDocument()
    })
    expect(screen.getByText('🙂')).toBeInTheDocument()
    // Tapper is gone
    expect(screen.queryByTitle('1/5')).not.toBeInTheDocument()
  })

  it('calls router.refresh() after successful quick check-in', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })
    renderCheckIn({ isOverdue: true })

    fireEvent.click(screen.getByTitle('5/5'))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it('does NOT show saved view or call refresh when action fails', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: false })
    renderCheckIn({ isOverdue: true })

    fireEvent.click(screen.getByTitle('5/5'))

    await waitFor(() => expect(mockCreateQuickCheckIn).toHaveBeenCalled())
    expect(screen.queryByText('Gespeichert ✓')).not.toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
    // Tapper stays visible
    expect(screen.getByTitle('1/5')).toBeInTheDocument()
  })
})
