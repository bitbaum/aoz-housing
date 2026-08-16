import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import { PortalSidebar } from '../PortalSidebar'
import { PORTAL_NAV_ITEMS } from '@/lib/config/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'

let mockPathname = '/portal'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: {
    href: string; children: React.ReactNode; className?: string
  }) => <a href={href} className={className} {...rest}>{children}</a>,
}))

jest.mock('@/lib/constants/labels', () => jest.requireActual('@/lib/constants/labels'))

function renderSidebar(hasStaffAccess?: boolean) {
  return render(<PortalSidebar hasStaffAccess={hasStaffAccess} />)
}

describe('PortalSidebar', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('shows EVERY destination, not only the ones that fit a row', () => {
    // The whole reason the sidebar exists. The old header row could hold seven
    // links, so the rest were reachable on a phone and invisible on a laptop.
    const { container } = renderSidebar()

    for (const item of PORTAL_NAV_ITEMS) {
      expect({ href: item.href, present: Boolean(container.querySelector(`a[href="${item.href}"]`)) })
        .toEqual({ href: item.href, present: true })
    }
  })

  it('groups them under the same headings the mobile sheet uses', () => {
    // One nav config, two form factors. If the groupings differed, the product
    // would be telling a resident two different stories about where things are.
    renderSidebar()

    for (const heading of Object.values(PORTAL_LABELS.navGroups)) {
      expect(screen.getByText(heading)).toBeInTheDocument()
    }
  })

  it('marks the open page as current', () => {
    mockPathname = '/portal/expenses'
    const { container } = renderSidebar()

    expect(container.querySelector('a[href="/portal/expenses"][aria-current="page"]'))
      .toBeInTheDocument()
  })

  it('keeps the section marked on a detail page below it', () => {
    mockPathname = '/portal/chores/abc'
    const { container } = renderSidebar()

    expect(container.querySelector('a[href="/portal/chores"][aria-current="page"]'))
      .toBeInTheDocument()
  })

  it('offers logout', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: PORTAL_LABELS.nav.logout }))
      .toHaveAttribute('type', 'submit')
  })

  it('shows the staff switch only for someone who has staff access', () => {
    const { unmount } = renderSidebar(false)
    expect(screen.queryByRole('link', { name: /Verwaltung/ })).not.toBeInTheDocument()
    unmount()

    renderSidebar(true)
    expect(screen.getByRole('link', { name: /Verwaltung/ })).toHaveAttribute('href', '/')
  })

  it('is hidden below the desktop breakpoint', () => {
    // Below `lg` the tab bar is the navigation; rendering both would put two
    // competing navs on one screen.
    const { container } = renderSidebar()
    expect(container.querySelector('aside')?.className).toContain('hidden')
    expect(container.querySelector('aside')?.className).toContain('lg:flex')
  })
})
