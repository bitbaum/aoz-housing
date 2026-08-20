import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CreateChoreForm } from '../CreateChoreForm'

// --- Mocks ---

jest.mock('@/lib/config/household-tasks', () => ({
  TASK_CATEGORY_LABELS: {
    CLEANING: 'Reinigung',
    TRASH: 'Abfall',
  },
  TASK_CATEGORY_ICONS: {
    CLEANING: '🧹',
    TRASH: '♻️',
  },
  TASK_TYPE_LABELS: {
    ONE_TIME: 'Einmalig',
    RECURRING_SCHEDULED: 'Regelmässig',
    RECURRING_AS_NEEDED: 'Nach Bedarf',
  },
  TASK_TYPE_DESCRIPTIONS: {
    ONE_TIME: 'Einmal erledigen',
    RECURRING_SCHEDULED: 'Regelmässiger Zeitplan',
    RECURRING_AS_NEEDED: 'Erledigen wenn nötig',
  },
  TASK_PRIORITY_LABELS: {
    LOW: 'Niedrig',
    NORMAL: 'Normal',
    HIGH: 'Hoch',
    URGENT: 'Dringend',
  },
  TASK_TEMPLATES: [
    {
      title: 'Badezimmer putzen',
      category: 'CLEANING',
      taskType: 'RECURRING_SCHEDULED',
      instructions: 'WC, Lavabo und Dusche reinigen.',
      estimatedMinutes: 30,
      scheduleHuman: 'Wöchentlich',
    },
    {
      title: 'Abfall rausbringen',
      category: 'TRASH',
      taskType: 'RECURRING_AS_NEEDED',
      estimatedMinutes: 10,
    },
  ],
  CHORE_LABELS: {
    actions: { useTemplate: 'Vorlage verwenden' },
    form: {
      title: 'Titel',
      titlePlaceholder: 'z.B. Küche aufräumen',
      description: 'Beschreibung (optional)',
      descriptionPlaceholder: 'Zusätzliche Details...',
      instructions: 'Anleitung (optional)',
      instructionsPlaceholder: 'Wie soll die Aufgabe erledigt werden...',
      category: 'Kategorie',
      taskType: 'Art',
      priority: 'Priorität',
      schedule: 'Zeitplan (optional)',
      schedulePlaceholder: 'z.B. Jeden Montag',
      estimatedMinutes: 'Geschätzte Dauer (Min.)',
      submit: 'Aufgabe erstellen',
      submitting: 'Wird erstellt...',
    },
    errors: { generic: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.' },
  },
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// --- Helpers ---

function mockFetchSuccess(id?: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: id ? { id } : {} }),
  } as unknown as Response)
}

function mockFetchApiError(message = 'Ungültig') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: message }),
  } as unknown as Response)
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
}

// --- Tests ---

describe('CreateChoreForm', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  // ── Rendering ───────────────────────────────────────────────────────────

  it('renders the title input and submit button', () => {
    render(<CreateChoreForm />)
    expect(screen.getByLabelText(/Titel/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aufgabe erstellen' })).toBeInTheDocument()
  })

  it('renders all template buttons', () => {
    render(<CreateChoreForm />)
    expect(screen.getByText('Vorlage verwenden')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Badezimmer putzen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abfall rausbringen/i })).toBeInTheDocument()
  })

  it('renders category and priority selects', () => {
    render(<CreateChoreForm />)
    expect(screen.getByLabelText('Kategorie')).toBeInTheDocument()
    expect(screen.getByLabelText('Priorität')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Reinigung/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Normal' })).toBeInTheDocument()
  })

  // ── Template picker ─────────────────────────────────────────────────────

  it('fills in title and instructions when a template is applied', () => {
    render(<CreateChoreForm />)
    fireEvent.click(screen.getByRole('button', { name: /Badezimmer putzen/i }))

    expect(screen.getByLabelText(/Titel/)).toHaveValue('Badezimmer putzen')
    expect(screen.getByLabelText(/Anleitung/)).toHaveValue('WC, Lavabo und Dusche reinigen.')
  })

  it('fills in estimatedMinutes when a template is applied', () => {
    render(<CreateChoreForm />)
    fireEvent.click(screen.getByRole('button', { name: /Badezimmer putzen/i }))

    expect(screen.getByLabelText(/Dauer/)).toHaveValue(30)
  })

  it('fills in scheduleHuman when template has a schedule', () => {
    render(<CreateChoreForm />)
    fireEvent.click(screen.getByRole('button', { name: /Badezimmer putzen/i }))

    expect(screen.getByLabelText(/Zeitplan/)).toHaveValue('Wöchentlich')
  })

  it('can switch between templates', () => {
    render(<CreateChoreForm />)

    fireEvent.click(screen.getByRole('button', { name: /Badezimmer putzen/i }))
    expect(screen.getByLabelText(/Titel/)).toHaveValue('Badezimmer putzen')

    fireEvent.click(screen.getByRole('button', { name: /Abfall rausbringen/i }))
    expect(screen.getByLabelText(/Titel/)).toHaveValue('Abfall rausbringen')
  })

  // ── Schedule field visibility ────────────────────────────────────────────

  it('shows schedule field when task type starts with RECURRING', () => {
    render(<CreateChoreForm />)
    // Default taskType is RECURRING_AS_NEEDED — schedule field should be visible
    expect(screen.getByLabelText(/Zeitplan/)).toBeInTheDocument()
  })

  it('hides schedule field when ONE_TIME task type is selected', () => {
    render(<CreateChoreForm />)
    fireEvent.click(screen.getByRole('button', { name: /Einmalig/i }))
    expect(screen.queryByLabelText(/Zeitplan/)).not.toBeInTheDocument()
  })

  it('shows schedule field again when switching back to RECURRING', () => {
    render(<CreateChoreForm />)
    fireEvent.click(screen.getByRole('button', { name: /Einmalig/i }))
    expect(screen.queryByLabelText(/Zeitplan/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Regelmässig/i }))
    expect(screen.getByLabelText(/Zeitplan/)).toBeInTheDocument()
  })

  // ── Submission ──────────────────────────────────────────────────────────

  it('submits to /api/portal/chores as POST with FormData', async () => {
    mockFetchSuccess()
    render(<CreateChoreForm />)

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Küche aufräumen' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Aufgabe erstellen' }).closest('form')!)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/portal/chores')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect((options.body as FormData).get('title')).toBe('Küche aufräumen')
  })

  it('redirects to the created chore with the created flag on success', async () => {
    mockFetchSuccess('chore-9')
    render(<CreateChoreForm />)

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Test Aufgabe' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Aufgabe erstellen' }).closest('form')!)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/portal/chores/chore-9?created=true'))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('shows API error message when submission fails', async () => {
    mockFetchApiError('Aufgabe ungültig')
    render(<CreateChoreForm />)

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Test' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Aufgabe erstellen' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Aufgabe ungültig')
    })
    // Form stays visible
    expect(screen.getByLabelText(/Titel/)).toBeInTheDocument()
  })

  it('shows generic error on network failure', async () => {
    mockFetchNetworkError()
    render(<CreateChoreForm />)

    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Test' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Aufgabe erstellen' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ein Fehler ist aufgetreten. Bitte erneut versuchen.'
      )
    })
  })

  it('shows pending label while submitting', async () => {
    let resolve: (v: unknown) => void
    global.fetch = jest.fn().mockReturnValue(new Promise(r => { resolve = r }))

    render(<CreateChoreForm />)
    fireEvent.change(screen.getByLabelText(/Titel/), { target: { value: 'Test' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Aufgabe erstellen' }).closest('form')!)

    expect(await screen.findByRole('button', { name: 'Wird erstellt...' })).toBeDisabled()

    await act(async () => { resolve!({ ok: true }) })
  })
})
