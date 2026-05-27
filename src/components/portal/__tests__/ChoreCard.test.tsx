import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChoreCard } from '../ChoreCard'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, title }: {
    href: string; children: React.ReactNode; className?: string; title?: string
  }) => <a href={href} className={className} title={title}>{children}</a>,
}))

jest.mock('@/lib/config/household-tasks', () => ({
  TASK_CATEGORY_ICONS: { CLEANING: '🧹', OTHER: '📋' },
  TASK_STATUS_COLORS: {
    IDLE: 'bg-gray-100 text-gray-700',
    NEEDS_ATTENTION: 'bg-yellow-100 text-yellow-700',
    REQUESTED: 'bg-purple-100 text-purple-700',
  },
  TASK_STATUS_LABELS: {
    IDLE: 'Bereit',
    NEEDS_ATTENTION: 'Achtung',
    REQUESTED: 'Angefragt',
  },
  TASK_PRIORITY_COLORS: {
    HIGH: 'bg-status-warning/15 text-status-warning-text',
    URGENT: 'bg-status-error/15 text-status-error-text',
  },
  CHORE_LABELS: {
    card: {
      lastCompleted: 'Zuletzt erledigt',
      never: 'Noch nie',
      by: 'von',
    },
    openTaskHint: 'Empfohlen: Aufgabe öffnen und zuerst Entscheidung treffen.',
    openTaskAction: 'Aufgabe öffnen und Entscheidung treffen',
    markDoneDirectly: 'Direkt als erledigt markieren',
    done: 'Erledigt',
  },
}))

jest.mock('@/lib/constants', () => ({
  UI_LABELS: { details: 'Details' },
}))

jest.mock('@/lib/utils', () => ({
  formatDate: (date: string) => `formatted:${date}`,
}))

// --- Helpers ---

const BASE_TASK = {
  id: 'task-1',
  title: 'Küche putzen',
  category: 'CLEANING',
  currentStatus: 'IDLE',
  priority: 'NORMAL',
  isCompleted: false,
  taskType: 'RECURRING',
  completions: [] as Array<{ completedAt: string; completedBy: { code: string } }>,
  attentionFlags: [] as Array<{ id: string }>,
  requests: [] as Array<{ id: string }>,
}

function renderCard(taskOverrides = {}, isCompleting = false, onQuickComplete = jest.fn()) {
  const task = { ...BASE_TASK, ...taskOverrides }
  return render(
    <ChoreCard task={task} onQuickComplete={onQuickComplete} isCompleting={isCompleting} />
  )
}

// --- Tests ---

describe('ChoreCard', () => {
  // ── Task link ─────────────────────────────────────────────────────────────

  it('renders a link to the task detail page', () => {
    renderCard()
    expect(screen.getByRole('link', { name: /Küche putzen/ })).toHaveAttribute('href', '/portal/chores/task-1')
  })

  it('displays the task title', () => {
    renderCard()
    expect(screen.getByText('Küche putzen')).toBeInTheDocument()
  })

  // ── Category icon ─────────────────────────────────────────────────────────

  it('renders the category icon for CLEANING', () => {
    renderCard({ category: 'CLEANING' })
    expect(screen.getByText('🧹')).toBeInTheDocument()
  })

  it('falls back to OTHER icon for unknown category', () => {
    renderCard({ category: 'UNKNOWN_CAT' })
    expect(screen.getByText('📋')).toBeInTheDocument()
  })

  // ── Status badge ──────────────────────────────────────────────────────────

  it('hides status badge when status is IDLE', () => {
    renderCard({ currentStatus: 'IDLE' })
    expect(screen.queryByText('Bereit')).not.toBeInTheDocument()
  })

  it('shows status badge for non-IDLE statuses', () => {
    renderCard({ currentStatus: 'NEEDS_ATTENTION' })
    expect(screen.getByText('Achtung')).toBeInTheDocument()
  })

  it('shows status badge for REQUESTED status', () => {
    renderCard({ currentStatus: 'REQUESTED' })
    expect(screen.getByText('Angefragt')).toBeInTheDocument()
  })

  // ── Priority badge ────────────────────────────────────────────────────────

  it('shows "!" for URGENT priority', () => {
    renderCard({ priority: 'URGENT' })
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('shows "↑" for HIGH priority', () => {
    renderCard({ priority: 'HIGH' })
    expect(screen.getByText('↑')).toBeInTheDocument()
  })

  it('hides priority badge for NORMAL priority', () => {
    renderCard({ priority: 'NORMAL' })
    expect(screen.queryByText('!')).not.toBeInTheDocument()
    expect(screen.queryByText('↑')).not.toBeInTheDocument()
  })

  // ── Last completion ───────────────────────────────────────────────────────

  it('shows "Noch nie" when there are no completions', () => {
    renderCard({ completions: [] })
    expect(screen.getByText(/Noch nie/)).toBeInTheDocument()
  })

  it('shows formatted last completion date and code', () => {
    renderCard({
      completions: [{ completedAt: '2024-01-15', completedBy: { code: 'RES-001' } }],
    })
    expect(screen.getByText(/formatted:2024-01-15.*RES-001/)).toBeInTheDocument()
  })

  // ── Quick complete button (normal state) ──────────────────────────────────

  it('shows quick-complete button when task is not completed and not in decision state', () => {
    renderCard({ isCompleted: false, currentStatus: 'IDLE' })
    expect(screen.getByRole('button', { name: /Erledigt/ })).toBeInTheDocument()
  })

  it('calls onQuickComplete with task id when button clicked', () => {
    const onQuickComplete = jest.fn()
    renderCard({ isCompleted: false, currentStatus: 'IDLE' }, false, onQuickComplete)
    fireEvent.click(screen.getByRole('button'))
    expect(onQuickComplete).toHaveBeenCalledWith('task-1')
  })

  it('disables quick-complete button when isCompleting is true', () => {
    renderCard({ isCompleted: false, currentStatus: 'IDLE' }, true)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows "..." when isCompleting is true', () => {
    renderCard({ isCompleted: false, currentStatus: 'IDLE' }, true)
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('hides quick-complete button when task is already completed', () => {
    renderCard({ isCompleted: true, currentStatus: 'IDLE' })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  // ── Needs-decision state ──────────────────────────────────────────────────

  it('shows "Details" link instead of complete button when NEEDS_ATTENTION', () => {
    renderCard({ currentStatus: 'NEEDS_ATTENTION', isCompleted: false })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    const links = screen.getAllByRole('link')
    const detailsLink = links.find(l => l.textContent === 'Details')
    expect(detailsLink).toBeDefined()
    expect(detailsLink).toHaveAttribute('href', '/portal/chores/task-1')
  })

  it('shows "Details" link instead of complete button when REQUESTED', () => {
    renderCard({ currentStatus: 'REQUESTED', isCompleted: false })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    const links = screen.getAllByRole('link')
    const detailsLink = links.find(l => l.textContent === 'Details')
    expect(detailsLink).toBeDefined()
  })

  it('shows open-task hint text when status requires decision', () => {
    renderCard({ currentStatus: 'NEEDS_ATTENTION', isCompleted: false })
    expect(screen.getByText(/Empfohlen: Aufgabe öffnen/)).toBeInTheDocument()
  })

  it('hides open-task hint text for IDLE status', () => {
    renderCard({ currentStatus: 'IDLE' })
    expect(screen.queryByText(/Empfohlen: Aufgabe öffnen/)).not.toBeInTheDocument()
  })
})
