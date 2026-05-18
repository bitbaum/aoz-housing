import '@testing-library/jest-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'

// --- Navigation mock ---

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}))

let mockPathname = '/'
const mockRouter = { push: jest.fn(), refresh: jest.fn() }

// --- next/link mock ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, onClick }: {
    href: string; children: React.ReactNode; className?: string; onClick?: () => void
  }) => <a href={href} className={className} onClick={onClick}>{children}</a>,
}))

// --- Config/constants mocks ---

jest.mock('@/lib/config/navigation', () => ({
  NAV_ITEMS: [
    { href: '/', icon: 'home', label: 'Dashboard' },
    { href: '/residents', icon: 'users', label: 'Bewohner' },
    { href: '/housing', icon: 'building', label: 'Unterkünfte' },
  ],
  NAV_ICONS: {
    home: () => <svg data-testid="icon-home" />,
    users: () => <svg data-testid="icon-users" />,
    building: () => <svg data-testid="icon-building" />,
  },
}))

jest.mock('@/lib/constants/labels', () => ({
  APP_LABELS: { tagline: 'Kompatibles Wohnen' },
  UI_LABELS: {
    menuOpen: 'Menü öffnen',
    menuClose: 'Menü schliessen',
    navigation: 'Navigation',
    userMenu: 'Benutzermenü',
    switchToPortal: 'Zum Portal wechseln',
    logout: 'Abmelden',
    loggingOut: 'Abmelden...',
  },
  ROLE_LABELS: { ADMIN: 'Administrator' },
}))

jest.mock('@/components/ui/Logo', () => ({
  Logo: ({ size }: { size?: string }) => <div data-testid={`logo-${size}`} />,
}))

// --- Component imports (after mocks) ---
import { MobileNav } from '../MobileNav'
import { UserMenu } from '../UserMenu'

// =============================================================================
// MobileNav
// =============================================================================

describe('MobileNav', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('renders the hamburger button', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: 'Menü öffnen' })).toBeInTheDocument()
  })

  it('hamburger has aria-expanded=false initially', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('drawer is hidden initially (translate-x-full)', () => {
    const { container } = render(<MobileNav />)
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('-translate-x-full')
  })

  it('opens drawer when hamburger clicked', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('translate-x-0')
  })

  it('hamburger has aria-expanded=true when open', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows close button when drawer is open', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('button', { name: 'Menü schliessen' })).toBeInTheDocument()
  })

  it('close button hides drawer', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Menü schliessen' }))
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('-translate-x-full')
  })

  it('shows backdrop when open', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument()
  })

  it('hides backdrop when closed', () => {
    const { container } = render(<MobileNav />)
    expect(container.querySelector('.fixed.inset-0')).not.toBeInTheDocument()
  })

  it('clicking backdrop closes drawer', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.click(container.querySelector('.fixed.inset-0')!)
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('-translate-x-full')
  })

  it('Escape key closes drawer', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('-translate-x-full')
  })

  it('renders all nav item labels', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bewohner')).toBeInTheDocument()
    expect(screen.getByText('Unterkünfte')).toBeInTheDocument()
  })

  it('renders nav links with correct hrefs', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(screen.getByRole('link', { name: /Bewohner/ })).toHaveAttribute('href', '/residents')
  })

  it('clicking nav link closes drawer', () => {
    const { container } = render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.click(screen.getByRole('link', { name: /Dashboard/ }))
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer?.className).toContain('-translate-x-full')
  })

  it('drawer has role=dialog with aria-modal', () => {
    const { container } = render(<MobileNav />)
    const drawer = container.querySelector('#mobile-nav-drawer')
    expect(drawer).toHaveAttribute('role', 'dialog')
    expect(drawer).toHaveAttribute('aria-modal', 'true')
  })

  it('marks active link for current pathname', () => {
    mockPathname = '/residents'
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    // The active link should have the neutral active class.
    const residentsLink = screen.getByRole('link', { name: /Bewohner/ })
    expect(residentsLink.className).toContain('bg-neutral-100')
  })

  it('sets body overflow hidden when open', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when closed', () => {
    render(<MobileNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menü öffnen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Menü schliessen' }))
    expect(document.body.style.overflow).toBe('')
  })
})

// =============================================================================
// UserMenu
// =============================================================================

const BASE_USER = { name: 'Anna Meier', email: 'anna@example.com', role: 'ADMIN' }

describe('UserMenu', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    mockRouter.refresh.mockClear()
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })

  it('renders toggle button with aria-label', () => {
    render(<UserMenu user={BASE_USER} />)
    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toBeInTheDocument()
  })

  it('shows user initials in avatar', () => {
    render(<UserMenu user={BASE_USER} />)
    expect(screen.getByText('AM')).toBeInTheDocument()
  })

  it('dropdown is hidden initially', () => {
    render(<UserMenu user={BASE_USER} />)
    expect(screen.queryByText('anna@example.com')).not.toBeInTheDocument()
  })

  it('opens dropdown when button clicked', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByText('anna@example.com')).toBeInTheDocument()
  })

  it('shows user name in dropdown', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    // Name appears in header + dropdown
    expect(screen.getAllByText('Anna Meier').length).toBeGreaterThanOrEqual(1)
  })

  it('shows role label in dropdown', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByText('Administrator')).toBeInTheDocument()
  })

  it('toggle button has aria-expanded=true when open', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes dropdown on outside mousedown', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('anna@example.com')).not.toBeInTheDocument()
  })

  it('hides portal link when hasPortalAccess is false', () => {
    render(<UserMenu user={BASE_USER} hasPortalAccess={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.queryByText('Zum Portal wechseln')).not.toBeInTheDocument()
  })

  it('shows portal link when hasPortalAccess is true', () => {
    render(<UserMenu user={BASE_USER} hasPortalAccess />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByText('Zum Portal wechseln')).toBeInTheDocument()
  })

  it('portal link points to /portal', () => {
    render(<UserMenu user={BASE_USER} hasPortalAccess />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByRole('link', { name: 'Zum Portal wechseln' })).toHaveAttribute('href', '/portal')
  })

  it('shows logout button', () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    expect(screen.getByRole('button', { name: 'Abmelden' })).toBeInTheDocument()
  })

  it('calls logout API and redirects on logout click', async () => {
    render(<UserMenu user={BASE_USER} />)
    fireEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Abmelden' }))
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('shows initials from multi-word name', () => {
    render(<UserMenu user={{ ...BASE_USER, name: 'Max Müller' }} />)
    expect(screen.getByText('MM')).toBeInTheDocument()
  })

  it('caps initials at 2 characters', () => {
    render(<UserMenu user={{ ...BASE_USER, name: 'Anna Berta Clara' }} />)
    expect(screen.getByText('AB')).toBeInTheDocument()
  })
})

// =============================================================================
// FairnessSummary
// =============================================================================

jest.mock('@/lib/config/household-tasks', () => ({
  CHORE_LABELS: {
    fairness: { title: 'Beiträge', completions: 'Erledigungen' },
  },
}))

import { FairnessSummary } from '../../portal/FairnessSummary'

describe('FairnessSummary', () => {
  it('renders section title', () => {
    render(<FairnessSummary fairness={[]} />)
    expect(screen.getByText('Beiträge')).toBeInTheDocument()
  })

  it('renders resident codes', () => {
    render(<FairnessSummary fairness={[
      { residentId: 'r1', code: 'RES-001', completions: 5 },
      { residentId: 'r2', code: 'RES-002', completions: 3 },
    ]} />)
    expect(screen.getByText('RES-001')).toBeInTheDocument()
    expect(screen.getByText('RES-002')).toBeInTheDocument()
  })

  it('shows completion counts', () => {
    render(<FairnessSummary fairness={[
      { residentId: 'r1', code: 'RES-001', completions: 5 },
    ]} />)
    expect(screen.getByText(/5 Erledigungen/)).toBeInTheDocument()
  })

  it('sets top performer bar to 100%', () => {
    const { container } = render(<FairnessSummary fairness={[
      { residentId: 'r1', code: 'RES-001', completions: 10 },
      { residentId: 'r2', code: 'RES-002', completions: 5 },
    ]} />)
    const bars = container.querySelectorAll('[style*="width"]')
    const widths = Array.from(bars).map(b => (b as HTMLElement).style.width)
    expect(widths).toContain('100%')
    expect(widths).toContain('50%')
  })

  it('handles all-zero completions without division by zero (uses max 1)', () => {
    const { container } = render(<FairnessSummary fairness={[
      { residentId: 'r1', code: 'RES-001', completions: 0 },
    ]} />)
    const bar = container.querySelector('[style*="width"]') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })
})
