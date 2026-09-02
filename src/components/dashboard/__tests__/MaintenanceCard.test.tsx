import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MaintenanceCard } from '../MaintenanceCard'

// --- Mocks ---

vi.mock('next/link', async () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/constants/labels', async () => ({
  MAINTENANCE_CARD_LABELS: {
    title: 'Wartung & Service',
    openSuffix: 'offen',
    oldestTicket: (days: number) => `Ältestes Ticket: ${days} Tage`,
    urgentCount: (count: number) => `${count} dringend`,
    allDone: 'Alles erledigt',
    newTicket: 'Neues Ticket',
    viewAll: 'Alle Tickets →',
  },
}))

// --- Helpers ---

function renderCard(
  overrides: {
    openTickets?: number
    urgentTickets?: number
    oldestTicketDays?: number
  } = {},
) {
  return render(
    <MaintenanceCard
      openTickets={overrides.openTickets ?? 0}
      urgentTickets={overrides.urgentTickets ?? 0}
      oldestTicketDays={overrides.oldestTicketDays}
    />,
  )
}

// --- Tests ---

describe('MaintenanceCard', () => {
  // ── Heading ───────────────────────────────────────────────────────────────

  it('renders the section heading', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Wartung & Service' })).toBeInTheDocument()
  })

  // ── All-done (empty) state ────────────────────────────────────────────────

  it('shows "Alles erledigt" when openTickets === 0', () => {
    renderCard({ openTickets: 0 })
    expect(screen.getByText('Alles erledigt')).toBeInTheDocument()
  })

  it('hides open-ticket stat when openTickets === 0', () => {
    renderCard({ openTickets: 0 })
    expect(screen.queryByText('offen')).not.toBeInTheDocument()
  })

  // ── Open tickets ──────────────────────────────────────────────────────────

  it('displays open ticket count when openTickets > 0', () => {
    renderCard({ openTickets: 5 })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('offen')).toBeInTheDocument()
  })

  it('hides "Alles erledigt" when openTickets > 0', () => {
    renderCard({ openTickets: 2 })
    expect(screen.queryByText('Alles erledigt')).not.toBeInTheDocument()
  })

  // ── Colour thresholds ─────────────────────────────────────────────────────

  it('applies success colour when openTickets === 0', () => {
    const { container } = renderCard({ openTickets: 0 })
    // "Alles erledigt" paragraph has text-status-success-text class
    expect(container.querySelector('.text-status-success-text')).toBeInTheDocument()
  })

  it('applies warning colour when openTickets is 1–7', () => {
    const { container } = renderCard({ openTickets: 4 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when openTickets > 7', () => {
    const { container } = renderCard({ openTickets: 8 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Oldest ticket age ─────────────────────────────────────────────────────

  it('shows oldest ticket age when openTickets > 0 and oldestTicketDays provided', () => {
    renderCard({ openTickets: 3, oldestTicketDays: 7 })
    expect(screen.getByText('Ältestes Ticket: 7 Tage')).toBeInTheDocument()
  })

  it('does not show oldest age when openTickets === 0', () => {
    renderCard({ openTickets: 0, oldestTicketDays: 7 })
    expect(screen.queryByText(/Ältestes Ticket/)).not.toBeInTheDocument()
  })

  // ── Urgent tickets ────────────────────────────────────────────────────────

  it('shows urgent ticket badge when urgentTickets > 0', () => {
    renderCard({ openTickets: 3, urgentTickets: 2 })
    expect(screen.getByText('2 dringend')).toBeInTheDocument()
  })

  it('hides urgent ticket badge when urgentTickets === 0', () => {
    renderCard({ openTickets: 3, urgentTickets: 0 })
    expect(screen.queryByText(/dringend/)).not.toBeInTheDocument()
  })

  it('links urgent badge to /maintenance?priority=URGENT', () => {
    renderCard({ openTickets: 2, urgentTickets: 1 })
    expect(screen.getByRole('link', { name: /dringend/ })).toHaveAttribute(
      'href',
      '/maintenance?priority=URGENT',
    )
  })

  // ── Quick action link ─────────────────────────────────────────────────────

  it('always renders the "Neues Ticket" link', () => {
    renderCard({ openTickets: 0 })
    expect(screen.getByRole('link', { name: /Neues Ticket/ })).toHaveAttribute(
      'href',
      '/maintenance/new',
    )
  })

  // ── View-all link ─────────────────────────────────────────────────────────

  it('shows view-all link when openTickets > 0', () => {
    renderCard({ openTickets: 2 })
    expect(screen.getByRole('link', { name: 'Alle Tickets →' })).toHaveAttribute(
      'href',
      '/maintenance',
    )
  })

  it('hides view-all link when openTickets === 0', () => {
    renderCard({ openTickets: 0 })
    expect(screen.queryByRole('link', { name: 'Alle Tickets →' })).not.toBeInTheDocument()
  })
})
