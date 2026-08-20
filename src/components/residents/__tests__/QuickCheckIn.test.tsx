import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickCheckIn } from '../QuickCheckIn'
import { QUICK_CHECKIN_LABELS } from '@/lib/constants/labels'

// --- Mocks ---

const mockCreateQuickCheckIn = jest.fn()
jest.mock('@/lib/actions/satisfaction', () => ({
  createQuickCheckIn: (...args: unknown[]) => mockCreateQuickCheckIn(...args),
}))

const mockShowToast = jest.fn()
jest.mock('@/components/ui/Toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
})

// --- Default props ---

const DEFAULT_PROPS = {
  placementId: 'placement-1',
  residentId: 'resident-1',
  checkInCount: 2,
  weeksSinceStart: 4,
}

// --- Tests ---

describe('QuickCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders satisfaction emoji buttons', () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    // All 5 satisfaction options rendered
    const radioGroup = screen.getByRole('radiogroup', { name: /Zufriedenheit/i })
    expect(radioGroup).toBeInTheDocument()

    const options = screen.getAllByRole('radio', { name: /von 5/i })
    expect(options).toHaveLength(5)
  })

  test('shows week and check-in count summary', () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    expect(screen.getByText(/Woche 4/)).toBeInTheDocument()
    expect(screen.getByText(/2 Check-ins bisher/)).toBeInTheDocument()
  })

  test('shows singular "Check-in" when count is 1', () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} checkInCount={1} />)
    expect(screen.getByText(/1 Check-in bisher/)).toBeInTheDocument()
  })

  test('shows link to detailed check-in form', () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    const link = screen.getByRole('link', { name: /Detaillierter Check-in/i })
    expect(link).toHaveAttribute('href', '/placements/placement-1/checkin')
  })

  test('shows previous satisfaction indicator when lastSatisfaction provided', () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} lastSatisfaction={4} />)
    expect(screen.getByText(/Letzter:/)).toBeInTheDocument()
  })

  test('submits immediately on high satisfaction (4 or 5)', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })

    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    // Select "Zufrieden" (value=4)
    const happyOption = screen.getByRole('radio', { name: /Zufrieden \(4 von 5\)/i })
    fireEvent.click(happyOption)

    await waitFor(() => {
      expect(mockCreateQuickCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          placementId: 'placement-1',
          overallSatisfaction: 4,
          roommateRelations: null,
        })
      )
    })
  })

  test('shows expanded form on low satisfaction (1-3)', async () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    // Select "Unzufrieden" (value=2)
    const unhappyOption = screen.getByRole('radio', { name: /Unzufrieden \(2 von 5\)/i })
    fireEvent.click(unhappyOption)

    // Expanded form appears
    await waitFor(() => {
      expect(screen.getByLabelText(QUICK_CHECKIN_LABELS.roommateLabel, { exact: false })).not.toBeNull()
    })
  })

  test('shows expanded form cancel button that resets state', async () => {
    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    const unhappyOption = screen.getByRole('radio', { name: /Unzufrieden \(2 von 5\)/i })
    fireEvent.click(unhappyOption)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Abbrechen/i })).toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }))

    // Expanded form is gone, main form still visible
    expect(screen.queryByRole('button', { name: /Abbrechen/i })).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /Zufriedenheit/i })).toBeInTheDocument()
  })

  test('shows success state after successful submission', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })

    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    const happyOption = screen.getByRole('radio', { name: /Sehr zufrieden \(5 von 5\)/i })
    fireEvent.click(happyOption)

    await waitFor(() => {
      expect(screen.getByText(/Check-in gespeichert/)).toBeInTheDocument()
    })
    expect(mockShowToast).toHaveBeenCalledWith('success', expect.any(String))
  })

  test('shows error message when submission fails', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: false, error: 'Fehler beim Speichern' })

    render(<QuickCheckIn {...DEFAULT_PROPS} />)

    const unhappyOption = screen.getByRole('radio', { name: /Unzufrieden \(2 von 5\)/i })
    fireEvent.click(unhappyOption)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Speichern$/i })).toBeInTheDocument()
    )

    // Add roommate rating to satisfy the canSubmit condition
    const roommateButton = screen.getByRole('radio', { name: /OK \(3 von 5\)/i })
    fireEvent.click(roommateButton)

    fireEvent.click(screen.getByRole('button', { name: /^Speichern$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Fehler beim Speichern')
    })
  })

  test('sets checkInType INITIAL for first check-in (count=0)', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })

    render(<QuickCheckIn {...DEFAULT_PROPS} checkInCount={0} />)

    const happyOption = screen.getByRole('radio', { name: /Zufrieden \(4 von 5\)/i })
    fireEvent.click(happyOption)

    await waitFor(() => {
      expect(mockCreateQuickCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({ checkInType: 'INITIAL' })
      )
    })
  })

  test('sets checkInType REGULAR for subsequent check-ins', async () => {
    mockCreateQuickCheckIn.mockResolvedValue({ success: true })

    render(<QuickCheckIn {...DEFAULT_PROPS} checkInCount={3} />)

    const happyOption = screen.getByRole('radio', { name: /Zufrieden \(4 von 5\)/i })
    fireEvent.click(happyOption)

    await waitFor(() => {
      expect(mockCreateQuickCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({ checkInType: 'REGULAR' })
      )
    })
  })
})
