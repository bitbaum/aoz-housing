import '@testing-library/jest-dom'
import { de } from '@/lib/i18n/dictionaries/de'
import type { MessageKey } from '@/lib/i18n/dictionaries/de'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PortalTabBar } from '../PortalTabBar'
import {
  PORTAL_SIDEBAR_GROUPS,
  portalSidebarItems,
  portalTabItems,
} from '@/lib/config/navigation'
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

function renderBar() {
  return render(<PortalTabBar />)
}

function openSheet() {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) }))
}

describe('PortalTabBar', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('pins the tab destinations permanently, with no tap required', () => {
    const { container } = renderBar()

    for (const item of portalTabItems()) {
      expect(container.querySelector(`.tab-bar a[href="${item.href}"]`)).toBeInTheDocument()
    }
  })

  it('marks the open tab as the current page', () => {
    const tabs = portalTabItems()
    const second = tabs[1]
    if (!second) return
    mockPathname = second.href
    const { container } = renderBar()

    expect(container.querySelector(`a[href="${second.href}"][aria-current="page"]`)).toBeInTheDocument()
  })

  it('keeps the tab marked on a detail page below it', () => {
    const tabs = portalTabItems()
    const second = tabs[1]
    if (!second) return
    mockPathname = `${second.href}/abc`
    const { container } = renderBar()

    expect(container.querySelector(`a[href="${second.href}"][aria-current="page"]`)).toBeInTheDocument()
  })

  it('marks "Mehr" when the open page lives in the sheet', () => {
    const tabs = portalTabItems()
    const sheetPage = portalSidebarItems().find(
      (item) => !tabs.some((tab) => tab.href === item.href)
    )
    if (!sheetPage) return
    mockPathname = sheetPage.href
    renderBar()

    const more = screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) })
    expect(more.className).toContain('tab-item-active')
  })

  it('does not mark "Mehr" while a pinned tab is open', () => {
    mockPathname = portalTabItems()[0]?.href ?? '/portal'
    renderBar()

    const more = screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) })
    expect(more.className).toBe('tab-item')
  })

  it('does not mark "Mehr" on account pages — those live in the header', () => {
    mockPathname = '/portal/profile'
    renderBar()

    const more = screen.getByRole('button', { name: new RegExp(PORTAL_LABELS.nav.more) })
    expect(more.className).toBe('tab-item')
  })

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

  it('offers every sidebar destination in the sheet', () => {
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    for (const item of portalSidebarItems()) {
      expect({ href: item.href, present: Boolean(sheet.querySelector(`a[href="${item.href}"]`)) })
        .toEqual({ href: item.href, present: true })
    }
  })

  it('keeps account pages and dead pages out of the sheet', () => {
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    expect(sheet.querySelector('a[href="/portal/profile"]')).not.toBeInTheDocument()
    expect(sheet.querySelector('a[href="/portal/apartment"]')).not.toBeInTheDocument()
    expect(sheet.querySelector('a[href="/portal/roommates"]')).not.toBeInTheDocument()
  })

  it('groups the sheet under collapsible headings', () => {
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    expect(sheet.querySelectorAll('details').length).toBe(PORTAL_SIDEBAR_GROUPS.length)
    for (const group of PORTAL_SIDEBAR_GROUPS) {
      expect(within(sheet).getByText(de[`navGroup.${group}` as MessageKey])).toBeInTheDocument()
    }
    expect(within(sheet).queryByText(de['navGroup.account'])).not.toBeInTheDocument()
  })

  it('does not dump the language picker into the sheet', () => {
    renderBar()
    openSheet()
    const sheet = screen.getByRole('dialog')

    expect(within(sheet).queryByRole('combobox', { name: 'Sprache wechseln' })).not.toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: 'Shqip' })).not.toBeInTheDocument()
  })
})
