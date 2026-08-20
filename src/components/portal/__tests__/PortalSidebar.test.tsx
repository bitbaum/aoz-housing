import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { PortalSidebar } from '../PortalSidebar'
import { PORTAL_SIDEBAR_GROUPS, portalSidebarItems } from '@/lib/config/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { createTranslator } from '@/lib/i18n'

// The components render group headings from the i18n dictionary. A second copy
// lived in PORTAL_LABELS.navGroups, read by nothing but these tests, and it had
// already drifted ('Alltag & Wohnen' vs 'Alltag'). Read the real source.
const groupHeading = (group: string) => createTranslator('de')(`navGroup.${group}` as never)

let mockPathname = '/portal'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: {
    href: string; children: React.ReactNode; className?: string
  }) => <a href={href} className={className} {...rest}>{children}</a>,
}))

describe('PortalSidebar', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('lists every sidebar destination', () => {
    const { container } = render(<PortalSidebar />)

    for (const item of portalSidebarItems()) {
      expect(container.querySelector(`a[href="${item.href}"]`)).toBeInTheDocument()
    }
  })

  it('does not list apartment, roommates, or account pages', () => {
    const { container } = render(<PortalSidebar />)

    expect(container.querySelector('a[href="/portal/apartment"]')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/portal/roommates"]')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/portal/profile"]')).not.toBeInTheDocument()
  })

  it('renders one collapsible group per sidebar section', () => {
    const { container } = render(<PortalSidebar />)

    expect(container.querySelectorAll('details')).toHaveLength(PORTAL_SIDEBAR_GROUPS.length)
    for (const group of PORTAL_SIDEBAR_GROUPS) {
      expect(screen.getByText(groupHeading(group))).toBeInTheDocument()
    }
  })

  it('opens the group that contains the current page', () => {
    mockPathname = '/portal/learning'
    render(<PortalSidebar />)

    const integration = screen.getByText(groupHeading('integration')).closest('details')
    expect(integration).toHaveAttribute('open')

    const living = screen.getByText(groupHeading('living')).closest('details')
    expect(living).not.toHaveAttribute('open')
  })
})
