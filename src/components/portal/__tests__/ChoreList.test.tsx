import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ChoreList } from '../ChoreList'

// --- Mocks ---

jest.mock('../ChoreCard', () => ({
  ChoreCard: ({ task, onQuickComplete, isCompleting }: {
    task: { id: string; title: string }
    onQuickComplete: (id: string) => void
    isCompleting: boolean
  }) => (
    <div data-testid={`chore-card-${task.id}`}>
      <span>{task.title}</span>
      <button onClick={() => onQuickComplete(task.id)} disabled={isCompleting}>
        {isCompleting ? 'completing' : 'complete'}
      </button>
    </div>
  ),
}))

jest.mock('../ChoreBalanceSummary', () => ({
  ChoreBalanceSummary: ({ balances }: { balances: Array<{ code: string }> }) => (
    <div data-testid="chore-balance-summary">{balances.map(b => b.code).join(',')}</div>
  ),
}))

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('@/lib/config/household-tasks', () => ({
  TASK_CATEGORY_LABELS: { CLEANING: 'Reinigung', COOKING: 'Kochen' },
  TASK_CATEGORY_ICONS: { CLEANING: '🧹', COOKING: '🍳' },
  CHORE_LABELS: {
    filter: { all: 'Alle' },
    card: { completed: 'Erledigt' },
    empty: { title: 'Noch keine Aufgaben', message: 'Erstelle die erste Aufgabe für eure Wohnung.' },
    errors: { generic: 'Ein Fehler ist aufgetreten.' },
    sections: {
      urgentNow: 'Jetzt wichtig',
      urgentDesc: 'Diese Aufgaben brauchen zuerst eine Entscheidung.',
      after: 'Danach',
    },
  },
}))

// --- Fixtures ---

function makeTask(overrides: {
  id: string
  title: string
  category?: string
  currentStatus?: string
  priority?: string
  isCompleted?: boolean
}) {
  return {
    id: overrides.id,
    title: overrides.title,
    category: overrides.category ?? 'CLEANING',
    currentStatus: overrides.currentStatus ?? 'IDLE',
    priority: overrides.priority ?? 'NORMAL',
    isCompleted: overrides.isCompleted ?? false,
    taskType: 'RECURRING',
    completions: [],
    attentionFlags: [],
    requests: [],
  }
}

// --- Tests ---

describe('ChoreList', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    mockRefresh.mockClear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows empty state when no tasks provided', () => {
    render(<ChoreList tasks={[]} balances={[]} />)
    expect(screen.getByText('Noch keine Aufgaben')).toBeInTheDocument()
    expect(screen.getByText(/Erstelle die erste Aufgabe/)).toBeInTheDocument()
  })

  // ── Task rendering ────────────────────────────────────────────────────────

  it('renders active tasks', () => {
    const tasks = [makeTask({ id: 't1', title: 'Küche putzen' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByTestId('chore-card-t1')).toBeInTheDocument()
  })

  it('renders completed tasks in the completed section', () => {
    const tasks = [makeTask({ id: 't1', title: 'Done task', isCompleted: true })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByText('Erledigt')).toBeInTheDocument()
    expect(screen.getByTestId('chore-card-t1')).toBeInTheDocument()
  })

  // ── Urgent / needs-attention section ─────────────────────────────────────

  it('shows urgent section header when tasks have NEEDS_ATTENTION status', () => {
    const tasks = [makeTask({ id: 't1', title: 'Attention task', currentStatus: 'NEEDS_ATTENTION' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByText('Jetzt wichtig')).toBeInTheDocument()
  })

  it('shows urgent section header for URGENT priority tasks', () => {
    const tasks = [makeTask({ id: 't1', title: 'Urgent task', priority: 'URGENT' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByText('Jetzt wichtig')).toBeInTheDocument()
  })

  it('hides urgent section header for normal priority active tasks', () => {
    const tasks = [makeTask({ id: 't1', title: 'Normal task' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.queryByText('Jetzt wichtig')).not.toBeInTheDocument()
  })

  it('shows "Danach" separator when both urgent and routine tasks exist', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Urgent', currentStatus: 'NEEDS_ATTENTION' }),
      makeTask({ id: 't2', title: 'Routine' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByText('Danach')).toBeInTheDocument()
  })

  it('hides "Danach" separator when only urgent tasks exist', () => {
    const tasks = [makeTask({ id: 't1', title: 'Urgent', currentStatus: 'NEEDS_ATTENTION' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.queryByText('Danach')).not.toBeInTheDocument()
  })

  // ── Category filter tabs ──────────────────────────────────────────────────

  it('hides filter tabs when only one category present', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Clean 1', category: 'CLEANING' }),
      makeTask({ id: 't2', title: 'Clean 2', category: 'CLEANING' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.queryByText('Alle')).not.toBeInTheDocument()
  })

  it('shows filter tabs when multiple categories present', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Clean', category: 'CLEANING' }),
      makeTask({ id: 't2', title: 'Cook', category: 'COOKING' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    expect(screen.getByText('Alle')).toBeInTheDocument()
    expect(screen.getByText(/Reinigung/)).toBeInTheDocument()
    expect(screen.getByText(/Kochen/)).toBeInTheDocument()
  })

  it('filters to selected category when tab clicked', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Clean task', category: 'CLEANING' }),
      makeTask({ id: 't2', title: 'Cook task', category: 'COOKING' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    fireEvent.click(screen.getByText(/Reinigung/))
    expect(screen.getByTestId('chore-card-t1')).toBeInTheDocument()
    expect(screen.queryByTestId('chore-card-t2')).not.toBeInTheDocument()
  })

  it('resets to all tasks when "Alle" clicked after filtering', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Clean task', category: 'CLEANING' }),
      makeTask({ id: 't2', title: 'Cook task', category: 'COOKING' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    fireEvent.click(screen.getByText(/Reinigung/))
    fireEvent.click(screen.getByText('Alle'))
    expect(screen.getByTestId('chore-card-t1')).toBeInTheDocument()
    expect(screen.getByTestId('chore-card-t2')).toBeInTheDocument()
  })

  it('toggles category off when same tab clicked twice', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Clean task', category: 'CLEANING' }),
      makeTask({ id: 't2', title: 'Cook task', category: 'COOKING' }),
    ]
    render(<ChoreList tasks={tasks} balances={[]} />)
    fireEvent.click(screen.getByText(/Reinigung/))
    fireEvent.click(screen.getByText(/Reinigung/))
    expect(screen.getByTestId('chore-card-t1')).toBeInTheDocument()
    expect(screen.getByTestId('chore-card-t2')).toBeInTheDocument()
  })

  // ── Quick complete (fetch flow) ───────────────────────────────────────────

  it('calls fetch with POST when quick-complete triggered', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const tasks = [makeTask({ id: 'task-99', title: 'My task' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'complete' }))
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/portal/chores/task-99/complete', { method: 'POST' })
  })

  it('shows completing state while fetch is in progress', async () => {
    let resolveRequest!: (value: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValueOnce(
      new Promise(res => { resolveRequest = res })
    )
    const tasks = [makeTask({ id: 'task-99', title: 'My task' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'complete' }))
    expect(await screen.findByRole('button', { name: 'completing' })).toBeInTheDocument()
    // Clean up the pending promise
    await act(async () => { resolveRequest({ ok: false }) })
  })

  it('does not refresh when fetch returns non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    const tasks = [makeTask({ id: 'task-99', title: 'My task' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'complete' }))
    })
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('refreshes router when fetch returns ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
    const tasks = [makeTask({ id: 'task-99', title: 'My task' })]
    render(<ChoreList tasks={tasks} balances={[]} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'complete' }))
    })
    expect(mockRefresh).toHaveBeenCalled()
  })

  // ── Contribution balance ──────────────────────────────────────────────────

  it('renders the balance summary when there is a household to compare', () => {
    const balances = [
      { residentId: 'r1', code: 'RES-001', displayName: null, doneMinutes: 45, shareMinutes: 30, balanceMinutes: 15 },
    ]
    render(<ChoreList tasks={[]} balances={balances} />)
    expect(screen.getByTestId('chore-balance-summary')).toBeInTheDocument()
    expect(screen.getByText('RES-001')).toBeInTheDocument()
  })

  it('hides the balance summary when there is nobody to compare against', () => {
    render(<ChoreList tasks={[]} balances={[]} />)
    expect(screen.queryByTestId('chore-balance-summary')).not.toBeInTheDocument()
  })
})
