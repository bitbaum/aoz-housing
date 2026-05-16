import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QuickStat } from '../QuickStatsRow'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const BASE = {
  label: 'Freie Plätze',
  value: 5,
  href: '/housing',
  color: 'green' as const,
  icon: '🛏️',
}

describe('QuickStat', () => {
  it('renders the label', () => {
    render(<QuickStat {...BASE} />)
    expect(screen.getByText('Freie Plätze')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<QuickStat {...BASE} value={8} />)
    expect(screen.getByText(/8/)).toBeInTheDocument()
  })

  it('appends suffix to value when provided', () => {
    render(<QuickStat {...BASE} value={3} suffix=" überfällig" />)
    expect(screen.getByText(/3 überfällig/)).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<QuickStat {...BASE} icon="⏰" />)
    expect(screen.getByText('⏰')).toBeInTheDocument()
  })

  it('links to the href', () => {
    render(<QuickStat {...BASE} href="/placements?overdue=1" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/placements?overdue=1')
  })

  it('shows subtext when provided', () => {
    render(<QuickStat {...BASE} subtext="10/20 belegt" />)
    expect(screen.getByText('10/20 belegt')).toBeInTheDocument()
  })

  it('hides subtext when not provided', () => {
    render(<QuickStat {...BASE} />)
    expect(screen.queryByText(/belegt/)).not.toBeInTheDocument()
  })

  it('renders progress bar when total is provided', () => {
    const { container } = render(<QuickStat {...BASE} value={5} total={20} />)
    const bar = container.querySelector('[style*="width"]')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveStyle({ width: '25%' })
  })

  it('hides progress bar when total is not provided', () => {
    const { container } = render(<QuickStat {...BASE} />)
    expect(container.querySelector('[style*="width"]')).not.toBeInTheDocument()
  })

  it('applies green colour class for color=green', () => {
    const { container } = render(<QuickStat {...BASE} color="green" />)
    expect(container.querySelector('.text-status-success')).toBeInTheDocument()
  })

  it('applies red colour class for color=red', () => {
    const { container } = render(<QuickStat {...BASE} color="red" />)
    expect(container.querySelector('.text-status-error')).toBeInTheDocument()
  })

  it('applies yellow colour class for color=yellow', () => {
    const { container } = render(<QuickStat {...BASE} color="yellow" />)
    expect(container.querySelector('.text-status-warning')).toBeInTheDocument()
  })

  it('applies blue colour class for color=blue', () => {
    const { container } = render(<QuickStat {...BASE} color="blue" />)
    expect(container.querySelector('.text-status-info')).toBeInTheDocument()
  })
})
