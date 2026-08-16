import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { PortalNav } from '../PortalNav'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: {
    href: string; children: React.ReactNode; className?: string
  }) => <a href={href} className={className} {...rest}>{children}</a>,
}))

jest.mock('@/lib/constants/labels', () => jest.requireActual('@/lib/constants/labels'))

describe('PortalNav (mobile title bar)', () => {
  it('renders the brand link to /portal', () => {
    render(<PortalNav />)
    expect(screen.getByRole('link', { name: 'Mein Zuhause' })).toHaveAttribute('href', '/portal')
  })

  it('carries no destinations of its own', () => {
    // Navigation moved out of the header entirely: to the tab bar below `lg`
    // and the sidebar above it. A row that holds only the links that fit is
    // how pages ended up reachable on a phone and invisible on a laptop.
    render(<PortalNav />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/portal'])
  })

  it('no longer renders a hamburger', () => {
    render(<PortalNav />)
    expect(screen.queryByRole('button', { name: /Menü öffnen/i })).not.toBeInTheDocument()
  })
})
