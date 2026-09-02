import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { SystemHealth } from '../SystemHealth'

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

vi.mock('@/lib/constants', async () => ({
  SYSTEM_HEALTH_LABELS: {
    title: 'Systemstatus',
    conflictsThirtyDays: 'Konflikte (30 Tage)',
    worstUnit: (code: string, count: number) => `${code}: ${count} Konflikte →`,
    noHotspots: 'Keine Brennpunkte',
    bedsFree: 'Plätze frei',
    ofTotal: (total: number) => `von ${total} total`,
    maintenanceOpen: 'Wartung offen',
    oldest: (days: number) => `Älteste: ${days} Tage →`,
    allDone: 'Alles erledigt',
  },
}))

// --- Helpers ---

const BASE_PROPS = {
  totalConflicts: 0,
  unitCount: 5,
  freeBeds: 10,
  totalBeds: 20,
  openMaintenanceCount: 0,
}

function renderHealth(
  overrides: Partial<
    typeof BASE_PROPS & {
      worstUnit?: { code: string; id: string; conflicts: number }
      oldestTicketDays?: number
    }
  > = {},
) {
  return render(<SystemHealth {...BASE_PROPS} {...overrides} />)
}

// --- Tests ---

describe('SystemHealth', () => {
  // ── Section heading ───────────────────────────────────────────────────────

  it('renders the section heading', () => {
    renderHealth()
    expect(screen.getByRole('heading', { name: 'Systemstatus' })).toBeInTheDocument()
  })

  // ── Conflict count ────────────────────────────────────────────────────────

  it('displays total conflict count', () => {
    renderHealth({ totalConflicts: 4 })
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('applies success colour when totalConflicts === 0', () => {
    const { container } = renderHealth({ totalConflicts: 0 })
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies warning colour when totalConflicts is 1–3', () => {
    const { container } = renderHealth({ totalConflicts: 2 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when totalConflicts > 3', () => {
    const { container } = renderHealth({ totalConflicts: 5 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Worst unit link ───────────────────────────────────────────────────────

  it('shows worst-unit link when worstUnit is provided and has conflicts', () => {
    renderHealth({ worstUnit: { code: 'A01', id: 'unit-1', conflicts: 3 } })
    expect(screen.getByRole('link', { name: /A01: 3 Konflikte/ })).toHaveAttribute(
      'href',
      '/housing/unit-1',
    )
  })

  it('shows "Keine Brennpunkte" when worstUnit is not provided', () => {
    renderHealth()
    expect(screen.getByText('Keine Brennpunkte')).toBeInTheDocument()
  })

  it('shows "Keine Brennpunkte" when worstUnit has zero conflicts', () => {
    renderHealth({ worstUnit: { code: 'A01', id: 'unit-1', conflicts: 0 } })
    expect(screen.getByText('Keine Brennpunkte')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Konflikte/ })).not.toBeInTheDocument()
  })

  // ── Free beds ─────────────────────────────────────────────────────────────

  it('displays free bed count', () => {
    renderHealth({ freeBeds: 7 })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('shows total beds in the subtitle', () => {
    renderHealth({ freeBeds: 5, totalBeds: 30 })
    expect(screen.getByText('von 30 total')).toBeInTheDocument()
  })

  it('applies success colour when freeBeds >= 5', () => {
    const { container } = renderHealth({ freeBeds: 5 })
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies warning colour when freeBeds is 2–4', () => {
    const { container } = renderHealth({ freeBeds: 3, totalConflicts: 0, openMaintenanceCount: 0 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when freeBeds < 2', () => {
    const { container } = renderHealth({ freeBeds: 1, totalConflicts: 0, openMaintenanceCount: 0 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Maintenance count ─────────────────────────────────────────────────────

  it('displays open maintenance count', () => {
    renderHealth({ openMaintenanceCount: 5 })
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('applies success colour when openMaintenanceCount === 0', () => {
    const { container } = renderHealth({ openMaintenanceCount: 0 })
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies warning colour when openMaintenanceCount is 1–3', () => {
    const { container } = renderHealth({ openMaintenanceCount: 2, totalConflicts: 0, freeBeds: 10 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when openMaintenanceCount > 3', () => {
    const { container } = renderHealth({ openMaintenanceCount: 4, totalConflicts: 0, freeBeds: 10 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Oldest ticket link ────────────────────────────────────────────────────

  it('shows oldest ticket link when openMaintenanceCount > 0 and oldestTicketDays provided', () => {
    renderHealth({ openMaintenanceCount: 3, oldestTicketDays: 12 })
    expect(screen.getByRole('link', { name: 'Älteste: 12 Tage →' })).toHaveAttribute(
      'href',
      '/maintenance',
    )
  })

  it('shows "Alles erledigt" when openMaintenanceCount === 0', () => {
    renderHealth({ openMaintenanceCount: 0 })
    expect(screen.getByText('Alles erledigt')).toBeInTheDocument()
  })

  it('shows "Alles erledigt" when oldestTicketDays is not provided', () => {
    renderHealth({ openMaintenanceCount: 2 })
    expect(screen.getByText('Alles erledigt')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Älteste/ })).not.toBeInTheDocument()
  })
})
