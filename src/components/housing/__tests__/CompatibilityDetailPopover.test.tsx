import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompatibilityDetailPopover } from '../CompatibilityDetailPopover'
import type { CompatibilityScore } from '../CompatibilityDetailPopover'

// --- Mocks ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/lib/utils', () => ({
  getScoreColorClass: (score: number) =>
    score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : 'score-medium',
  getScoreLabel: (score: number) =>
    score >= 80 ? 'Sehr gut' : score >= 60 ? 'Gut' : 'Mittel',
}))

jest.mock('@/lib/constants', () => ({
  COMPATIBILITY_DIMENSION_LABELS: {
    lifestyle: { label: 'Lebensstil', description: 'Schlaf, Lärm, Sauberkeit' },
    social:    { label: 'Sozial',     description: 'Sprache, Umgang' },
    practical: { label: 'Praktisch',  description: 'Rauchen, Küche' },
    risk:      { label: 'Risiko',     description: 'Konfliktpotenzial' },
  },
  MATCHING_LABELS: {
    strengths: 'Stärken',
    concerns: 'Bedenken',
  },
  COMPATIBILITY_MATRIX_LABELS: {
    compatibilitySuffix: 'Kompatibilität',
    noScore: 'Keine Bewertung vorhanden',
    noScoreDesc: 'Die Kompatibilität wurde noch nicht berechnet',
  },
  UI_LABELS: {
    close: 'Schliessen',
  },
}))

jest.mock('@/lib/config/thresholds', () => ({
  SCORE_BG_COLORS: {
    excellent: 'bg-score-excellent',
    good: 'bg-score-good',
    moderate: 'bg-score-medium',
    low: 'bg-score-low',
    critical: 'bg-score-critical',
  },
  getScoreLevel: (score: number) =>
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'low',
}))

// --- Helpers ---

const R1 = { id: 'res-1', code: 'RES-001', displayName: null, ageRange: 'ADULT' as const, languages: ['de'] }
const R2 = { id: 'res-2', code: 'RES-002', displayName: null, ageRange: 'ADULT' as const, languages: ['en'] }
const POSITION = { x: 200, y: 100 }

function makeScore(overrides: Partial<CompatibilityScore> = {}): CompatibilityScore {
  return {
    id: 'sc-1',
    residentId: 'res-1',
    comparedWithId: 'res-2',
    overallScore: 75,
    ...overrides,
  }
}

function renderPopover(score: CompatibilityScore | null = makeScore()) {
  const onClose = jest.fn()
  render(
    <CompatibilityDetailPopover
      resident1={R1}
      resident2={R2}
      score={score}
      position={POSITION}
      onClose={onClose}
    />
  )
  return { onClose }
}

// --- Tests ---

describe('CompatibilityDetailPopover', () => {
  // ── Dialog role & aria-label ──────────────────────────────────────────────

  it('has dialog role', () => {
    renderPopover()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-label combining both resident codes', () => {
    renderPopover()
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Kompatibilität: RES-001 und RES-002'
    )
  })

  // ── Close button ──────────────────────────────────────────────────────────

  it('renders close button with aria-label', () => {
    renderPopover()
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const { onClose } = renderPopover()
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── Footer links ──────────────────────────────────────────────────────────

  it('renders footer link to resident1 profile', () => {
    renderPopover()
    const links = screen.getAllByRole('link', { name: 'RES-001' })
    expect(links.some(l => l.getAttribute('href') === '/residents/res-1')).toBe(true)
  })

  it('renders footer link to resident2 profile', () => {
    renderPopover()
    const links = screen.getAllByRole('link', { name: 'RES-002' })
    expect(links.some(l => l.getAttribute('href') === '/residents/res-2')).toBe(true)
  })

  // ── With score: overall ───────────────────────────────────────────────────

  it('shows overall score as percentage', () => {
    renderPopover(makeScore({ overallScore: 75 }))
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows score label from getScoreLabel', () => {
    renderPopover(makeScore({ overallScore: 75 }))
    // 75 → 'Gut'
    expect(screen.getByText(/Gut/)).toBeInTheDocument()
  })

  it('shows compatibilitySuffix label', () => {
    renderPopover(makeScore({ overallScore: 75 }))
    expect(screen.getByText(/Kompatibilität/)).toBeInTheDocument()
  })

  // ── With score: dimensions ────────────────────────────────────────────────

  it('shows lifestyle dimension when lifestyleScore defined', () => {
    renderPopover(makeScore({ lifestyleScore: 80 }))
    expect(screen.getByText('Lebensstil')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it('hides lifestyle dimension when lifestyleScore undefined', () => {
    renderPopover(makeScore({ lifestyleScore: undefined }))
    expect(screen.queryByText('Lebensstil')).not.toBeInTheDocument()
  })

  it('shows social dimension when socialScore defined', () => {
    renderPopover(makeScore({ socialScore: 65 }))
    expect(screen.getByText('Sozial')).toBeInTheDocument()
  })

  it('shows practical dimension when practicalScore defined', () => {
    renderPopover(makeScore({ practicalScore: 50 }))
    expect(screen.getByText('Praktisch')).toBeInTheDocument()
  })

  it('shows risk dimension when riskScore defined', () => {
    renderPopover(makeScore({ riskScore: 40 }))
    expect(screen.getByText('Risiko')).toBeInTheDocument()
  })

  // ── With score: strengths ─────────────────────────────────────────────────

  it('shows strengths section header when strengths present', () => {
    renderPopover(makeScore({ strengths: ['Gleicher Schlafrhythmus'] }))
    expect(screen.getByText('Stärken')).toBeInTheDocument()
  })

  it('shows strength text', () => {
    renderPopover(makeScore({ strengths: ['Gleicher Schlafrhythmus'] }))
    expect(screen.getByText('Gleicher Schlafrhythmus')).toBeInTheDocument()
  })

  it('shows at most 2 strengths', () => {
    renderPopover(makeScore({ strengths: ['S1', 'S2', 'S3'] }))
    expect(screen.getByText('S1')).toBeInTheDocument()
    expect(screen.getByText('S2')).toBeInTheDocument()
    expect(screen.queryByText('S3')).not.toBeInTheDocument()
  })

  it('hides strengths section when empty', () => {
    renderPopover(makeScore({ strengths: [] }))
    expect(screen.queryByText('Stärken')).not.toBeInTheDocument()
  })

  // ── With score: conflicts ─────────────────────────────────────────────────

  it('shows concerns section header when conflicts present', () => {
    renderPopover(makeScore({ conflicts: [{ message: 'Raucher', severity: 'BLOCKING' }] }))
    expect(screen.getByText('Bedenken')).toBeInTheDocument()
  })

  it('shows conflict message text', () => {
    renderPopover(makeScore({ conflicts: [{ message: 'Raucher', severity: 'BLOCKING' }] }))
    expect(screen.getByText('Raucher')).toBeInTheDocument()
  })

  it('shows at most 2 conflicts', () => {
    renderPopover(makeScore({
      conflicts: [
        { message: 'C1', severity: 'HIGH' },
        { message: 'C2', severity: 'HIGH' },
        { message: 'C3', severity: 'HIGH' },
      ],
    }))
    expect(screen.getByText('C1')).toBeInTheDocument()
    expect(screen.getByText('C2')).toBeInTheDocument()
    expect(screen.queryByText('C3')).not.toBeInTheDocument()
  })

  it('hides concerns section when conflicts empty', () => {
    renderPopover(makeScore({ conflicts: [] }))
    expect(screen.queryByText('Bedenken')).not.toBeInTheDocument()
  })

  // ── No score state ────────────────────────────────────────────────────────

  it('shows no-score message when score is null', () => {
    renderPopover(null)
    expect(screen.getByText('Keine Bewertung vorhanden')).toBeInTheDocument()
  })

  it('shows no-score description when score is null', () => {
    renderPopover(null)
    expect(screen.getByText(/noch nicht berechnet/)).toBeInTheDocument()
  })

  it('does not show percentage when score is null', () => {
    renderPopover(null)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  // ── Dimension bar width ───────────────────────────────────────────────────

  it('sets dimension bar width to score%', () => {
    const { container } = render(
      <CompatibilityDetailPopover
        resident1={R1}
        resident2={R2}
        score={makeScore({ lifestyleScore: 70 })}
        position={POSITION}
        onClose={jest.fn()}
      />
    )
    // The bar div has style width: 70%
    const bars = container.querySelectorAll('[style*="width"]')
    expect(Array.from(bars).some(el => (el as HTMLElement).style.width === '70%')).toBe(true)
  })
})
