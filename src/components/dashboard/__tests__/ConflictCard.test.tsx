import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ConflictCard } from '../ConflictCard'

// --- Mocks ---

jest.mock('next/link', () => ({
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

jest.mock('@/lib/constants/labels/dashboard', () => ({
  ALGORITHM_ACCURACY_LABELS: {
    conflictCardTitle: 'Konflikte',
    conflictCardActiveSuffix: 'aktiv (30 Tage)',
    conflictCardOldest: (days: number) => `Ältester: ${days} Tage ungelöst`,
    conflictCardHotspots: 'Brennpunkte',
    conflictCardOccupied: 'belegt',
    conflictCardConflictCount: (n: number) => `${n} Konflikte`,
    conflictCardLast7Days: 'Letzte 7 Tage',
    conflictCardNoneNew: '✓ Keine neuen',
    conflictCardNewCount: (n: number) => `${n} neue`,
    conflictCardAllClear: 'Keine aktiven Konflikte',
    conflictCardViewAll: 'Alle Vorfälle →',
  },
}))

jest.mock('@/lib/config/thresholds', () => ({
  DISPLAY_LIMITS: { dashboardItems: 3 },
}))

// --- Helpers ---

function renderCard(
  overrides: {
    activeConflicts?: number
    recentConflicts?: number
    hotspotUnits?: Array<{ id: string; code: string; conflicts: number; occupancy: string }>
    oldestConflictDays?: number
  } = {},
) {
  return render(
    <ConflictCard
      activeConflicts={overrides.activeConflicts ?? 0}
      recentConflicts={overrides.recentConflicts ?? 0}
      hotspotUnits={overrides.hotspotUnits ?? []}
      oldestConflictDays={overrides.oldestConflictDays}
    />,
  )
}

// --- Tests ---

describe('ConflictCard', () => {
  // ── Section heading ───────────────────────────────────────────────────────

  it('renders the section heading', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Konflikte' })).toBeInTheDocument()
  })

  // ── Active conflict count ─────────────────────────────────────────────────

  it('displays the active conflict count', () => {
    renderCard({ activeConflicts: 4 })
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('applies success colour when activeConflicts === 0', () => {
    const { container } = renderCard({ activeConflicts: 0 })
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies warning colour when activeConflicts is 1–5', () => {
    const { container } = renderCard({ activeConflicts: 3 })
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies error colour when activeConflicts > 5', () => {
    const { container } = renderCard({ activeConflicts: 6 })
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  // ── Oldest conflict age ───────────────────────────────────────────────────

  it('shows oldest conflict age when activeConflicts > 0 and oldestConflictDays provided', () => {
    renderCard({ activeConflicts: 2, oldestConflictDays: 14 })
    expect(screen.getByText('Ältester: 14 Tage ungelöst')).toBeInTheDocument()
  })

  it('hides oldest age when activeConflicts === 0', () => {
    renderCard({ activeConflicts: 0, oldestConflictDays: 14 })
    expect(screen.queryByText(/Ältester:/)).not.toBeInTheDocument()
  })

  it('hides oldest age when oldestConflictDays is not provided', () => {
    renderCard({ activeConflicts: 2 })
    expect(screen.queryByText(/Ältester:/)).not.toBeInTheDocument()
  })

  // ── Hotspot units ─────────────────────────────────────────────────────────

  it('hides hotspot section when hotspotUnits is empty', () => {
    renderCard({ hotspotUnits: [] })
    expect(screen.queryByText('Brennpunkte')).not.toBeInTheDocument()
  })

  it('shows hotspot section header when units are present', () => {
    renderCard({
      hotspotUnits: [{ id: 'u1', code: 'A01', conflicts: 3, occupancy: '4/5' }],
    })
    expect(screen.getByText('Brennpunkte')).toBeInTheDocument()
  })

  it('renders each hotspot unit with code, occupancy, and conflict count', () => {
    renderCard({
      hotspotUnits: [{ id: 'u1', code: 'A01', conflicts: 3, occupancy: '5/5' }],
    })
    expect(screen.getByText('A01')).toBeInTheDocument()
    expect(screen.getByText(/5\/5 belegt/)).toBeInTheDocument()
    expect(screen.getByText('3 Konflikte')).toBeInTheDocument()
  })

  it('links each hotspot unit to /housing/<id>', () => {
    renderCard({
      hotspotUnits: [{ id: 'unit-77', code: 'B02', conflicts: 2, occupancy: '3/4' }],
    })
    expect(screen.getByRole('link', { name: /B02/ })).toHaveAttribute('href', '/housing/unit-77')
  })

  it('limits hotspot display to DISPLAY_LIMITS.dashboardItems (3)', () => {
    const units = [1, 2, 3, 4].map((i) => ({
      id: `u${i}`,
      code: `U0${i}`,
      conflicts: i,
      occupancy: '5/5',
    }))
    renderCard({ hotspotUnits: units })
    expect(screen.getByText('U01')).toBeInTheDocument()
    expect(screen.getByText('U03')).toBeInTheDocument()
    expect(screen.queryByText('U04')).not.toBeInTheDocument()
  })

  // ── Recent 7-day trend ────────────────────────────────────────────────────

  it('shows "✓ Keine neuen" when recentConflicts === 0', () => {
    renderCard({ recentConflicts: 0 })
    expect(screen.getByText('✓ Keine neuen')).toBeInTheDocument()
  })

  it('shows new conflict count when recentConflicts > 0', () => {
    renderCard({ recentConflicts: 2 })
    expect(screen.getByText('2 neue')).toBeInTheDocument()
  })

  // ── All-clear state ───────────────────────────────────────────────────────

  it('shows all-clear message when activeConflicts === 0', () => {
    renderCard({ activeConflicts: 0 })
    expect(screen.getByText('Keine aktiven Konflikte')).toBeInTheDocument()
  })

  it('hides all-clear message when activeConflicts > 0', () => {
    renderCard({ activeConflicts: 1 })
    expect(screen.queryByText('Keine aktiven Konflikte')).not.toBeInTheDocument()
  })

  // ── Footer link ───────────────────────────────────────────────────────────

  it('renders the view-all link to /incidents', () => {
    renderCard()
    expect(screen.getByRole('link', { name: 'Alle Vorfälle →' })).toHaveAttribute(
      'href',
      '/incidents',
    )
  })
})
