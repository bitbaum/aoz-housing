import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { AllClearState, QuickActionsBar } from '../AllClearState'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/constants/labels', () => ({
  DASHBOARD_LABELS: {
    allClearTitle: 'Alles unter Kontrolle!',
    allClearConflictFreeSuffix: 'Tage ohne Konflikte.',
    allClearBedsReadySuffix: 'Plätze für neue Bewohner bereit.',
    allClearAllOccupied: 'Alle Plätze belegt.',
    allClearBedsFreeSuffix: 'Plätze frei',
    allClearNoDringend: 'Keine dringenden Aufgaben',
    actionCreateResident: 'Neuen Bewohner erfassen',
    actionViewStats: 'Statistiken ansehen',
    sectionQuickActions: 'Schnellaktionen',
    actionNewResident: 'Neuer Bewohner',
    actionNewUnit: 'Neue Einheit',
    actionStartMatching: 'Matching starten',
    actionReportIncident: 'Vorfall melden',
    actionMaintenanceTicket: 'Wartungsticket',
  },
}))

// ─── AllClearState ────────────────────────────────────────────────────────────

const CTA = { ctaHref: '/residents/new', ctaLabel: 'Neuen Bewohner erfassen' }

describe('AllClearState', () => {
  it('renders the all-clear title', () => {
    render(<AllClearState freeBeds={5} conflictFreeDays={10} {...CTA} />)
    expect(screen.getByRole('heading', { name: 'Alles unter Kontrolle!' })).toBeInTheDocument()
  })

  it('shows conflict-free day count when > 0', () => {
    render(<AllClearState freeBeds={5} conflictFreeDays={7} {...CTA} />)
    expect(screen.getByText(/7 Tage ohne Konflikte/)).toBeInTheDocument()
  })

  it('hides conflict-free days when 0', () => {
    render(<AllClearState freeBeds={5} conflictFreeDays={0} {...CTA} />)
    expect(screen.queryByText(/Tage ohne Konflikte/)).not.toBeInTheDocument()
  })

  it('shows free beds count and suffix when freeBeds > 0', () => {
    render(<AllClearState freeBeds={4} conflictFreeDays={0} {...CTA} />)
    expect(screen.getByText(/4 Plätze für neue Bewohner bereit/)).toBeInTheDocument()
  })

  it('shows "Alle Plätze belegt" when freeBeds === 0', () => {
    render(<AllClearState freeBeds={0} conflictFreeDays={5} {...CTA} />)
    expect(screen.getByText(/Alle Plätze belegt/)).toBeInTheDocument()
  })

  it('links the CTA to the given href', () => {
    render(<AllClearState freeBeds={2} conflictFreeDays={3} {...CTA} />)
    expect(screen.getByRole('link', { name: 'Neuen Bewohner erfassen' })).toHaveAttribute('href', '/residents/new')
  })

  it('renders a role-specific CTA when given one', () => {
    render(
      <AllClearState
        freeBeds={null}
        conflictFreeDays={null}
        ctaHref="/learning?board=overview"
        ctaLabel="Lernen & Kurse öffnen"
      />
    )
    expect(screen.getByRole('link', { name: 'Lernen & Kurse öffnen' })).toHaveAttribute(
      'href',
      '/learning?board=overview'
    )
  })

  it('says nothing about beds or conflicts when both sections are hidden (null)', () => {
    render(<AllClearState freeBeds={null} conflictFreeDays={null} {...CTA} />)
    expect(screen.queryByText(/Plätze/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Konflikte/)).not.toBeInTheDocument()
    expect(screen.getByText('Keine dringenden Aufgaben')).toBeInTheDocument()
  })

  it('does not render a secondary analytics CTA in the all-clear state', () => {
    render(<AllClearState freeBeds={2} conflictFreeDays={3} {...CTA} />)
    expect(screen.queryByRole('link', { name: 'Statistiken ansehen' })).not.toBeInTheDocument()
  })
})

// ─── QuickActionsBar ──────────────────────────────────────────────────────────

describe('QuickActionsBar', () => {
  it('renders the section heading', () => {
    render(<QuickActionsBar unplacedCount={0} freeBeds={0} />)
    expect(screen.getByText('Schnellaktionen')).toBeInTheDocument()
  })

  it('renders all 5 quick action links', () => {
    render(<QuickActionsBar unplacedCount={0} freeBeds={0} />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/residents/new')
    expect(hrefs).toContain('/housing/new')
    expect(hrefs).toContain('/matching')
    expect(hrefs).toContain('/incidents/new')
    expect(hrefs).toContain('/maintenance/new')
  })

  it('shows free bed count when freeBeds > 0', () => {
    render(<QuickActionsBar unplacedCount={0} freeBeds={7} />)
    expect(screen.getByText(/7 Plätze frei/)).toBeInTheDocument()
  })

  it('hides free bed count when freeBeds === 0', () => {
    render(<QuickActionsBar unplacedCount={0} freeBeds={0} />)
    expect(screen.queryByText(/Plätze frei/)).not.toBeInTheDocument()
  })

  it('shows matching badge count when unplaced > 0 and freeBeds > 0', () => {
    render(<QuickActionsBar unplacedCount={3} freeBeds={5} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides matching badge when unplaced === 0', () => {
    render(<QuickActionsBar unplacedCount={0} freeBeds={5} />)
    // Badge should not show — only "Matching starten" text
    const matchLink = screen.getByRole('link', { name: /Matching starten/ })
    expect(matchLink.querySelector('.bg-status-error')).not.toBeInTheDocument()
  })

  it('hides matching badge when freeBeds === 0', () => {
    render(<QuickActionsBar unplacedCount={3} freeBeds={0} />)
    const matchLink = screen.getByRole('link', { name: /Matching starten/ })
    expect(matchLink.querySelector('.bg-status-error')).not.toBeInTheDocument()
  })
})
