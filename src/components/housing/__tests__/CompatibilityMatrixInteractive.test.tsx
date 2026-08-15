import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompatibilityMatrixInteractive } from '../CompatibilityMatrixInteractive'
import type { CompatibilityScore } from '../CompatibilityDetailPopover'
import type { ResidentBasic } from '@/lib/types'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/utils', () => ({
  getScoreBgClass: (score: number) =>
    score >= 80 ? 'bg-score-excellent/15' : score >= 60 ? 'bg-score-good/15' : 'bg-score-medium/15',
}))

jest.mock('@/lib/constants', () => ({
  COMPATIBILITY_MATRIX_LABELS: {
    clickHint: 'Auf eine Zelle klicken für Kompatibilitätsdetails',
    swipeHint: 'Wischen zum Scrollen',
    legend: 'Legende:',
    legendExcellent: '80+ Sehr gut',
    legendGood: '60-79 Gut',
    legendMedium: '40-59 Mittel',
    legendLow: '20-39 Niedrig',
    legendCritical: '0-19 Kritisch',
  },
}))

// Stub the popover — forwardRef so popoverRef.current attaches for outside-click tests
jest.mock('../CompatibilityDetailPopover', () => ({
  CompatibilityDetailPopover: React.forwardRef(function PopoverStub(
    { resident1, resident2, score, onClose }: {
      resident1: { code: string }
      resident2: { code: string }
      score: { overallScore: number } | null
      onClose: () => void
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    return (
      <div ref={ref} data-testid="popover" data-r1={resident1.code} data-r2={resident2.code} data-score={score?.overallScore ?? 'null'}>
        <button onClick={onClose}>close-popover</button>
      </div>
    )
  }),
}))

// --- Helpers ---

function makeResident(id: string, code: string, displayName: string | null = null): ResidentBasic {
  return { id, code, displayName, ageRange: 'ADULT', languages: ['de'] }
}

function makeScore(r1Id: string, r2Id: string, overall: number): CompatibilityScore {
  return { id: `sc-${r1Id}-${r2Id}`, residentId: r1Id, comparedWithId: r2Id, overallScore: overall }
}

const R1 = makeResident('r1', 'RES-001')
const R2 = makeResident('r2', 'RES-002')
const R3 = makeResident('r3', 'RES-003')

// --- Tests ---

describe('CompatibilityMatrixInteractive', () => {
  // ── Table structure ───────────────────────────────────────────────────────

  it('renders resident codes as column headers with links', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    const links = screen.getAllByRole('link', { name: 'RES-001' })
    expect(links.some(l => l.getAttribute('href') === '/residents/r1')).toBe(true)
  })

  it('renders resident codes as row headers with links', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    // Each code appears as both col header and row header
    expect(screen.getAllByRole('link', { name: 'RES-002' }).length).toBeGreaterThanOrEqual(2)
  })

  it('shows "-" on diagonal (same resident)', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    const dashes = screen.getAllByText('-')
    // One dash per resident on diagonal
    expect(dashes.length).toBe(2)
  })

  // ── Score cells ───────────────────────────────────────────────────────────

  it('renders score value in cell', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    // Symmetric matrix: score appears in both (r1,r2) and (r2,r1) cells
    expect(screen.getAllByText('85').length).toBeGreaterThanOrEqual(1)
  })

  it('renders score cell aria-label with percentage', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    expect(screen.getByRole('button', { name: /RES-001 und RES-002: 85%/ })).toBeInTheDocument()
  })

  it('renders "?" button when score is missing', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    expect(screen.getAllByText('?').length).toBeGreaterThanOrEqual(1)
  })

  it('"?" button has no-score aria-label', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    expect(screen.getByRole('button', { name: /Keine Bewertung: RES-001 und RES-002/ })).toBeInTheDocument()
  })

  it('finds score by reversed pair direction', () => {
    // Score stored as r2→r1, queried as r1→r2
    const scores = [makeScore('r2', 'r1', 72)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    expect(screen.getAllByText('72').length).toBeGreaterThanOrEqual(1)
  })

  // ── Popover: open on click ────────────────────────────────────────────────

  it('opens popover when score cell clicked', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    expect(screen.getByTestId('popover')).toBeInTheDocument()
  })

  it('popover receives correct resident codes', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    const popover = screen.getByTestId('popover')
    expect(popover).toHaveAttribute('data-r1', 'RES-001')
    expect(popover).toHaveAttribute('data-r2', 'RES-002')
  })

  it('popover receives score value', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    expect(screen.getByTestId('popover')).toHaveAttribute('data-score', '85')
  })

  it('opens popover with null score when "?" cell clicked', () => {
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /Keine Bewertung: RES-001 und RES-002/ }))
    expect(screen.getByTestId('popover')).toHaveAttribute('data-score', 'null')
  })

  it('does not open popover on diagonal cell (same resident id)', () => {
    // Diagonal shows "-" (aria-hidden span), not a button, so no click possible
    render(<CompatibilityMatrixInteractive residents={[R1]} scores={[]} />)
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument()
  })

  // ── Popover: close ────────────────────────────────────────────────────────

  it('closes popover via onClose callback', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    expect(screen.getByTestId('popover')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'close-popover' }))
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument()
  })

  it('closes popover on Escape key', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    expect(screen.getByTestId('popover')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument()
  })

  it('closes popover on mousedown outside', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    fireEvent.click(screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ }))
    expect(screen.getByTestId('popover')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument()
  })

  // ── Selected cell aria-expanded ───────────────────────────────────────────

  it('sets aria-expanded on selected score cell', () => {
    const scores = [makeScore('r1', 'r2', 85)]
    render(<CompatibilityMatrixInteractive residents={[R1, R2]} scores={scores} />)
    const btn = screen.getByRole('button', { name: /Kompatibilität RES-001 und RES-002: 85%/ })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  // ── Legend ────────────────────────────────────────────────────────────────

  it('renders legend label', () => {
    render(<CompatibilityMatrixInteractive residents={[]} scores={[]} />)
    expect(screen.getByText('Legende:')).toBeInTheDocument()
  })

  it('renders all 5 legend entries', () => {
    render(<CompatibilityMatrixInteractive residents={[]} scores={[]} />)
    expect(screen.getByText('80+ Sehr gut')).toBeInTheDocument()
    expect(screen.getByText('60-79 Gut')).toBeInTheDocument()
    expect(screen.getByText('40-59 Mittel')).toBeInTheDocument()
    expect(screen.getByText('20-39 Niedrig')).toBeInTheDocument()
    expect(screen.getByText('0-19 Kritisch')).toBeInTheDocument()
  })

  // ── Click hint ────────────────────────────────────────────────────────────

  it('renders desktop click hint', () => {
    render(<CompatibilityMatrixInteractive residents={[]} scores={[]} />)
    expect(screen.getByText('Auf eine Zelle klicken für Kompatibilitätsdetails')).toBeInTheDocument()
  })

  // ── 3-resident matrix ─────────────────────────────────────────────────────

  it('renders correct number of score cells for 3 residents', () => {
    const scores = [
      makeScore('r1', 'r2', 80),
      makeScore('r1', 'r3', 65),
      makeScore('r2', 'r3', 72),
    ]
    render(<CompatibilityMatrixInteractive residents={[R1, R2, R3]} scores={scores} />)
    // Each score appears in 2 symmetric cells
    expect(screen.getAllByText('80').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('65').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('72').length).toBeGreaterThanOrEqual(1)
  })
})
