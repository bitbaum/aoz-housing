/**
 * The staff navigation as a vertical panel.
 *
 * What matters here is not that it renders — it is that EVERY destination a
 * role may reach is present without an interaction. The megamenu this replaced
 * put four of five groups behind a hover, and the fifth behind a horizontal
 * scroll on a 1280px laptop; a nav whose contents depend on pointer behaviour
 * cannot be asserted, and was not.
 */

import { render, screen } from '@testing-library/react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { visibleMegaMenuGroups } from '@/lib/config/navigation'

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

let mockPathname = '/'

beforeEach(() => {
  mockPathname = '/'
})

describe('AdminSidebar', () => {
  it('renders every destination an ADMIN can reach, with no interaction', () => {
    const groups = visibleMegaMenuGroups('ADMIN')
    render(<AdminSidebar groups={groups} />)

    const expected = groups.flatMap((group) =>
      'items' in group ? group.items.map((i) => i.label) : [group.label]
    )

    const missing = expected.filter((label) => screen.queryAllByText(label).length === 0)
    expect({ total: expected.length, missing }).toEqual({ total: expected.length, missing: [] })
  })

  it('shows a narrower role only what its permissions allow', () => {
    // JOBCOACH may not read housing or incidents. A nav that offered them
    // would end at /kein-zugriff — a dead end dressed as a destination.
    const groups = visibleMegaMenuGroups('JOBCOACH')
    render(<AdminSidebar groups={groups} />)

    expect(screen.queryByText('Unterkünfte')).toBeNull()
    expect(screen.queryByText('Vorfälle')).toBeNull()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('marks the current page, and only the current page', () => {
    mockPathname = '/incidents'
    render(<AdminSidebar groups={visibleMegaMenuGroups('ADMIN')} />)

    const current = screen.getAllByRole('link').filter(
      (link) => link.getAttribute('aria-current') === 'page'
    )

    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '/incidents')
  })

  it('opens the group holding the current page', () => {
    mockPathname = '/incidents'
    const { container } = render(<AdminSidebar groups={visibleMegaMenuGroups('ADMIN')} />)

    const open = Array.from(container.querySelectorAll('details[open]'))
    // Exactly one — arriving on a page must not expand the whole tree.
    expect(open).toHaveLength(1)
    expect(open[0]?.textContent).toContain('Vorfälle')
  })

  it('does not wrap a single destination in a one-item accordion', () => {
    // Dashboard and Nachrichten are links, not groups. An accordion holding
    // one item is a link wearing a hat.
    const { container } = render(<AdminSidebar groups={visibleMegaMenuGroups('ADMIN')} />)

    const oneItemGroups = Array.from(container.querySelectorAll('details')).filter(
      (d) => d.querySelectorAll('li').length === 1
    )
    expect(oneItemGroups).toEqual([])
  })
})
