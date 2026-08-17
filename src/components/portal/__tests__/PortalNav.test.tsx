import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { PortalNav } from '../PortalNav'

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

function renderNav(hasStaffAccess?: boolean) {
  return render(<PortalNav hasStaffAccess={hasStaffAccess} />)
}

function openAccount() {
  fireEvent.click(screen.getByRole('button', { name: 'Konto' }))
}

describe('PortalNav', () => {
  beforeEach(() => {
    mockPathname = '/portal'
  })

  it('renders the brand link to /portal', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Mein Zuhause' })).toHaveAttribute('href', '/portal')
  })

  it('keeps destinations out of the header — they live in the sidebar and tabs', () => {
    renderNav()
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/portal'])
    expect(hrefs).not.toContain('/portal/chores')
    expect(hrefs).not.toContain('/portal/apartment')
    expect(hrefs).not.toContain('/portal/roommates')
  })

  it('offers a compact language switcher, not a grid of every locale', () => {
    renderNav()
    expect(screen.getByRole('combobox', { name: 'Sprache wechseln' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Shqip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Soomaali' })).not.toBeInTheDocument()
  })

  it('no longer renders a hamburger', () => {
    renderNav()
    expect(screen.queryByRole('button', { name: /Menü öffnen/i })).not.toBeInTheDocument()
  })

  it('hides account destinations until the dropdown is opened', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: 'Profil' })).not.toBeInTheDocument()

    openAccount()
    expect(screen.getByRole('link', { name: 'Profil' })).toHaveAttribute('href', '/portal/profile')
    expect(screen.getByRole('link', { name: 'Hilfe' })).toHaveAttribute('href', '/portal/help')
  })

  it('hides "Zur Verwaltung" when hasStaffAccess is false', () => {
    renderNav(false)
    openAccount()
    expect(screen.queryByRole('link', { name: 'Zur Verwaltung' })).not.toBeInTheDocument()
  })

  it('links to the staff side when hasStaffAccess is true', () => {
    renderNav(true)
    openAccount()
    expect(screen.getByRole('link', { name: 'Zur Verwaltung' })).toHaveAttribute('href', '/')
  })

  it('renders the logout submit button in the account menu', () => {
    renderNav()
    openAccount()
    expect(screen.getByRole('button', { name: 'Abmelden' })).toHaveAttribute('type', 'submit')
  })
})
