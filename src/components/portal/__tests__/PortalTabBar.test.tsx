import '@testing-library/jest-dom'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PortalTabBar } from '../PortalTabBar'
import { PORTAL_NAV_ITEMS, PORTAL_TAB_ITEMS } from '@/lib/config/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'

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

jest.mock('@/lib/constants/labels', () => jest.requireActual('@/lib/constants/labels'))

function renderBar(hasStaffAccess?: boolean) {
  return render(<PortalTabBar hasStaffAccess={hasStaffAccess} />)
}

function openSheet() {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) }))
}

describe('PortalTabBar', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('pins the tab destinations permanently, with no tap required', () => {
    // The whole point: these are on screen before any interaction.
    const { container } = renderBar()

    for (const item of PORTAL_TAB_ITEMS) {
      expect(container.querySelector(`.tab-bar a[href="${item.href}"]`)).toBeInTheDocument()
    }
  })

  it('marks the open tab as the current page', () => {
    mockPathname = '/portal/chores'
    const { container } = renderBar()

    expect(container.querySelector('a[href="/portal/chores"][aria-current="page"]')).toBeInTheDocument()
  })

  it('keeps the tab marked on a detail page below it', () => {
    mockPathname = '/portal/chores/abc'
    const { container } = renderBar()

    expect(container.querySelector('a[href="/portal/chores"][aria-current="page"]')).toBeInTheDocument()
  })

  it('marks "Mehr" when the open page lives in the sheet', () => {
    // Otherwise a resident reading Regeln sees no mark at all and the bar
    // stops answering "where am I".
    mockPathname = '/portal/rules'
    renderBar()

    const more = screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) })
    expect(more.className).toContain('tab-item-active')
  })

  it('does not mark "Mehr" while a pinned tab is open', () => {
    mockPathname = '/portal/expenses'
    renderBar()

    const more = screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) })
    expect(more.className).toBe('tab-item')
  })

  // ── The sheet ─────────────────────────────────────────────────────────────

  it('keeps the sheet closed until asked', () => {
    renderBar()
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('hidden')
  })

  it('opens and closes the sheet', () => {
    renderBar()
    openSheet()
    expect(screen.getByRole('dialog')).not.toHaveAttribute('hidden')

    fireEvent.click(screen.getByRole('button', { name: PORTAL_LABELS.nav.closeMore }))
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('hidden')
  })

  it('closes the sheet on Escape', () => {
    renderBar()
    openSheet()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('hidden')
  })

  it('offers every navigation destination in the sheet', () => {
    // The sheet is the only place the non-pinned pages appear on a phone, so
    // anything missing here is unreachable.
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    for (const item of PORTAL_NAV_ITEMS) {
      expect({ href: item.href, present: Boolean(sheet.querySelector(`a[href="${item.href}"]`)) })
        .toEqual({ href: item.href, present: true })
    }
  })

  it('groups the sheet under headings instead of one flat list', () => {
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    for (const heading of Object.values(PORTAL_LABELS.navGroups)) {
      expect(within(sheet).getByText(heading)).toBeInTheDocument()
    }
  })

  it('offers logout from the sheet', () => {
    renderBar()
    openSheet()
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: PORTAL_LABELS.nav.logout }))
      .toHaveAttribute('type', 'submit')
  })

  it('shows the staff switch only when the person has staff access', () => {
    const { unmount } = renderBar(false)
    openSheet()
    expect(screen.queryByRole('link', { name: /Verwaltung/ })).not.toBeInTheDocument()
    unmount()

    renderBar(true)
    openSheet()
    expect(screen.getByRole('link', { name: /Verwaltung/ })).toHaveAttribute('href', '/')
  })
})
