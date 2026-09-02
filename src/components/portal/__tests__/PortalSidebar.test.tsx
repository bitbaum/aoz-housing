import '@testing-library/jest-dom/vitest'
import { de } from '@/lib/i18n/dictionaries/de'
import type { MessageKey } from '@/lib/i18n/dictionaries/de'
import { render, screen } from '@testing-library/react'
import { PortalSidebar } from '../PortalSidebar'
import { PORTAL_SIDEBAR_GROUPS, portalSidebarItems } from '@/lib/config/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'

let mockPathname = '/portal'

vi.mock('next/navigation', async () => ({
  usePathname: () => mockPathname,
}))

vi.mock('next/link', async () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
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

  it('pins the overview outside the groups', () => {
    // The way home must not depend on which accordion happens to be open — it
    // used to be the first child of "Alltag", so a resident reading their
    // learning record had to expand a different section to get back.
    const { container } = render(<PortalSidebar />)

    const overview = container.querySelector('a[href="/portal"]')
    expect(overview).toBeInTheDocument()
    expect(overview?.closest('details')).toBeNull()
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
      expect(screen.getByText(de[`navGroup.${group}` as MessageKey])).toBeInTheDocument()
    }
  })

  it('opens the group that contains the current page', () => {
    mockPathname = '/portal/learning'
    render(<PortalSidebar />)

    const integration = screen.getByText(de['navGroup.integration']).closest('details')
    expect(integration).toHaveAttribute('open')

    const living = screen.getByText(de['navGroup.living']).closest('details')
    expect(living).not.toHaveAttribute('open')
  })
})
