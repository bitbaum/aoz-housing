import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { PortalNav } from '../PortalNav'

// --- Mocks ---

let mockPathname = '/portal'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  // Passes the remaining props through: a mock that drops them silently
  // discards `aria-current`, so a test for the active state would be asserting
  // against the mock's shortcomings rather than the component's behaviour.
  default: ({ href, children, className, ...rest }: {
    href: string; children: React.ReactNode; className?: string
  }) => <a href={href} className={className} {...rest}>{children}</a>,
}))

// The real labels, not a restatement of them. A mock that lists the copy it
// expects passes happily after the copy changes — and silently stops covering
// any label added later, because the component reads a key the mock never had.
jest.mock('@/lib/constants/labels', () => jest.requireActual('@/lib/constants/labels'))

// --- Helpers ---

function renderNav(hasStaffAccess?: boolean) {
  return render(<PortalNav hasStaffAccess={hasStaffAccess} />)
}

// --- Tests ---

describe('PortalNav', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('renders the brand link to /portal', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Mein Zuhause' })).toHaveAttribute('href', '/portal')
  })

  it('renders the primary desktop nav links', () => {
    renderNav()
    const hrefs = screen.getAllByRole('link').map(link => link.getAttribute('href'))

    expect(hrefs).toContain('/portal')
    expect(hrefs).toContain('/portal/apartment')
    expect(hrefs).toContain('/portal/expenses')
    expect(hrefs).toContain('/portal/chores')
    expect(hrefs).toContain('/portal/report')
  })

  it('leaves secondary destinations to the tab bar sheet', () => {
    // The header is the wide-screen surface. Everything else is reachable from
    // `PortalTabBar`, which is what phones get.
    renderNav()
    const hrefs = screen.getAllByRole('link').map(link => link.getAttribute('href'))

    expect(hrefs).not.toContain('/portal/roommates')
    expect(hrefs).not.toContain('/portal/help')
  })

  it('no longer renders a hamburger', () => {
    // Guards the actual change: the flat fourteen-item list this replaced was
    // reachable only from this button, so its absence is the fix.
    renderNav()
    expect(screen.queryByRole('button', { name: /Menü öffnen/i })).not.toBeInTheDocument()
  })

  it('hides "Zur Verwaltung" when hasStaffAccess is false', () => {
    renderNav(false)
    expect(screen.queryByRole('link', { name: 'Zur Verwaltung' })).not.toBeInTheDocument()
  })

  it('links to the staff side when hasStaffAccess is true', () => {
    renderNav(true)
    expect(screen.getByRole('link', { name: 'Zur Verwaltung' })).toHaveAttribute('href', '/')
  })

  it('renders the logout submit button', () => {
    renderNav()
    expect(screen.getByRole('button', { name: 'Abmelden' })).toHaveAttribute('type', 'submit')
  })

  it('marks the overview as current on /portal', () => {
    mockPathname = '/portal'
    const { container } = renderNav()
    expect(container.querySelector('a[href="/portal"][aria-current="page"]')).toBeInTheDocument()
  })

  it('keeps Aufgaben marked while reading a single chore', () => {
    mockPathname = '/portal/chores/task-1'
    const { container } = renderNav()
    expect(container.querySelector('a[href="/portal/chores"][aria-current="page"]')).toBeInTheDocument()
  })
})
