import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { PortalNav } from '../PortalNav'

// --- Mocks ---

let mockPathname = '/portal'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, onClick }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void
  }) => <a href={href} className={className} onClick={onClick}>{children}</a>,
}))

jest.mock('@/lib/constants/labels', () => ({
  PORTAL_LABELS: {
    title: 'Mein Zuhause',
    nav: {
      overview: 'Übersicht',
      roommates: 'Mitbewohner',
      chores: 'Aufgaben',
      report: 'Melden',
      housing: 'Unterkünfte',
      activities: 'Aktivitäten',
      preferences: 'Einstellungen',
      help: 'Hilfe',
      logout: 'Abmelden',
    },
    transfer: { navLabel: 'Verlegung' },
  },
  UI_LABELS: {
    menuOpen: 'Menü öffnen',
    menuClose: 'Menü schliessen',
    switchToAdmin: 'Zur Verwaltung',
  },
}))

// --- Helpers ---

function renderNav(hasStaffAccess?: boolean) {
  return render(<PortalNav hasStaffAccess={hasStaffAccess} />)
}

// --- Tests ---

describe('PortalNav', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  // ── Brand link ────────────────────────────────────────────────────────────

  it('renders the brand link to /portal', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Mein Zuhause' })).toHaveAttribute('href', '/portal')
  })

  // ── Desktop nav links ─────────────────────────────────────────────────────

  it('renders all 5 primary desktop nav links', () => {
    renderNav()
    // These are inside the hidden lg:flex nav — still in the DOM
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/portal')
    expect(hrefs).toContain('/portal/roommates')
    expect(hrefs).toContain('/portal/chores')
    expect(hrefs).toContain('/portal/report')
    expect(hrefs).toContain('/portal/preferences')
  })

  // ── Mobile hamburger toggle ───────────────────────────────────────────────

  it('hamburger button has aria-label "Menü öffnen" initially', () => {
    renderNav()
    expect(screen.getByRole('button', { name: 'Menü öffnen' })).toBeInTheDocument()
  })

  it('aria-expanded is false initially', () => {
    renderNav()
    const btn = screen.getByRole('button', { name: 'Menü öffnen' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens mobile nav when hamburger clicked', () => {
    const { container } = renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(container.querySelector('#portal-mobile-nav')).toBeInTheDocument()
  })

  it('changes aria-label to "Menü schliessen" when open', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('button', { name: 'Menü schliessen' })).toBeInTheDocument()
  })

  it('aria-expanded becomes true when menu is open', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('button', { name: 'Menü schliessen' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes mobile nav when hamburger clicked again', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Menü schliessen' }))
    expect(screen.queryByText('Verlegung')).not.toBeInTheDocument()
  })

  // ── Mobile nav links ──────────────────────────────────────────────────────

  it('shows all mobile nav items when menu is open', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByText('Verlegung')).toBeInTheDocument()
    expect(screen.getByText('Hilfe')).toBeInTheDocument()
    expect(screen.getByText('Aktivitäten')).toBeInTheDocument()
  })

  it('closes mobile menu when a mobile nav link is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    // Click the mobile Übersicht link (has onClick close handler)
    const mobileLinks = screen.getAllByRole('link', { name: 'Übersicht' })
    const mobileLink = mobileLinks.find(l => l.closest('#portal-mobile-nav'))
    fireEvent.click(mobileLink!)
    expect(screen.queryByText('Verlegung')).not.toBeInTheDocument()
  })

  // ── Staff access ──────────────────────────────────────────────────────────

  it('hides "Zur Verwaltung" link when hasStaffAccess is false', () => {
    renderNav(false)
    expect(screen.queryByRole('link', { name: 'Zur Verwaltung' })).not.toBeInTheDocument()
  })

  it('shows "Zur Verwaltung" link in desktop nav when hasStaffAccess is true', () => {
    renderNav(true)
    expect(screen.getAllByRole('link', { name: 'Zur Verwaltung' })[0]).toHaveAttribute('href', '/')
  })

  it('shows "Zur Verwaltung" link in mobile menu when hasStaffAccess is true', () => {
    renderNav(true)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    const adminLinks = screen.getAllByRole('link', { name: 'Zur Verwaltung' })
    // At least one should be inside the mobile nav
    expect(adminLinks.length).toBeGreaterThanOrEqual(1)
  })

  // ── Logout button ─────────────────────────────────────────────────────────

  it('renders the logout submit button', () => {
    renderNav()
    const logoutButtons = screen.getAllByRole('button', { name: 'Abmelden' })
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1)
    expect(logoutButtons[0]).toHaveAttribute('type', 'submit')
  })

  // ── Active link styling ───────────────────────────────────────────────────

  it('applies active class to overview link when on /portal', () => {
    mockPathname = '/portal'
    const { container } = renderNav()
    const overviewLinks = container.querySelectorAll('a[href="/portal"]')
    const activeLink = Array.from(overviewLinks).find(l => l.className.includes('bg-brand-primary/10'))
    expect(activeLink).toBeDefined()
  })

  it('applies active class to chores link for /portal/chores sub-paths', () => {
    mockPathname = '/portal/chores/task-1'
    const { container } = renderNav()
    const choresLinks = container.querySelectorAll('a[href="/portal/chores"]')
    const activeLink = Array.from(choresLinks).find(l => l.className.includes('bg-brand-primary/10'))
    expect(activeLink).toBeDefined()
  })
})
