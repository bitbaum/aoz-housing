/**
 * Tests for popover-style and navigation UI components:
 * ExplainableNumber, ExplainableMetric,
 * ScoreExplanation, ScoreExplanationBadge,
 * PeriodSelector, ErrorBoundaryUI
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'

// --- Navigation mock (shared) ---

const mockRouterPush = jest.fn()
let mockPathname = '/incidents'
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}))

// --- next/link mock ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// --- Constants mocks ---

jest.mock('@/lib/constants/labels', () => ({
  UI_LABELS: {
    close: 'Schliessen',
    clickForDetails: 'Klicken für Details',
    errorTitle: 'Fehler',
    errorRetry: 'Erneut versuchen',
    errorToDashboard: 'Zum Dashboard',
  },
  EXPLAINABLE_NUMBER_LABELS: {
    formula: 'Formel',
    dataPoints: 'Datenpunkte',
    interpretation: 'Interpretation',
    explanationFor: 'Erklärung für',
    sources: {
      database: 'Datenbank',
      calculation: 'Berechnung',
      derived: 'Abgeleitet',
    },
  },
  SCORE_TYPE_LABELS: {
    compatibility: 'Kompatibilität',
    fit: 'Passgenauigkeit',
    harmony: 'Harmonie',
  },
  SCORE_LEVEL_EXPLANATIONS: {
    excellent: { description: 'Sehr hohe Übereinstimmung.', recommendation: 'Empfohlen.' },
    good: { description: 'Gute Übereinstimmung.', recommendation: 'Gute Option.' },
    moderate: { description: 'Moderate Übereinstimmung.', recommendation: 'Mit Vorsicht.' },
    low: { description: 'Geringe Übereinstimmung.', recommendation: 'Nur wenn nötig.' },
    critical: { description: 'Sehr geringe Übereinstimmung.', recommendation: 'Nicht platzieren.' },
  },
  SCORE_EXPLANATION_LABELS: { recommendation: 'Empfehlung', scale: 'Bewertungsskala:' },
  COMPATIBILITY_SCORE_LABELS: {
    excellent: 'Sehr gut',
    good: 'Gut',
    moderate: 'Mittel',
    low: 'Niedrig',
    critical: 'Kritisch',
  },
  MATCHING_LABELS: { strengths: 'Stärken', challenges: 'Herausforderungen' },
}))

jest.mock('@/lib/constants', () => ({
  UI_LABELS: {
    close: 'Schliessen',
    errorTitle: 'Fehler',
    errorRetry: 'Erneut versuchen',
    errorToDashboard: 'Zum Dashboard',
  },
}))

jest.mock('@/lib/config/thresholds', () => ({
  getScoreLevel: (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'moderate'
    if (score >= 20) return 'low'
    return 'critical'
  },
  SCORE_THRESHOLDS: { excellent: 80, good: 60, moderate: 40, low: 20 },
}))

jest.mock('@/lib/utils/formatting', () => ({
  getScoreColorClass: () => 'text-score-excellent-text',
  getScoreLabel: (score: number) => {
    if (score >= 80) return 'Sehr gut'
    if (score >= 60) return 'Gut'
    return 'Mittel'
  },
}))

jest.mock('@/lib/config/ui-tokens', () => ({
  SCORE_TOKENS: {
    excellent: { soft: 'bg-score-excellent/15 text-score-excellent-text' },
    good: { soft: 'bg-score-good/15 text-score-good-text' },
    moderate: { soft: 'bg-score-medium/15 text-score-medium-text' },
    low: { soft: 'bg-score-low/15 text-score-low-text' },
    critical: { soft: 'bg-score-critical/15 text-score-critical-text' },
  },
}))

// --- Component imports (after mocks) ---
import { ExplainableNumber, ExplainableMetric } from '../ExplainableNumber'
import type { NumberExplanation } from '../ExplainableNumber'
import { ScoreExplanation, ScoreExplanationBadge } from '../ScoreExplanation'
import { PeriodSelector } from '../PeriodSelector'
import { ErrorBoundaryUI } from '../ErrorBoundaryUI'

// =============================================================================
// ExplainableNumber
// =============================================================================

const BASE_EXPLANATION: NumberExplanation = {
  label: 'Vorfälle',
  source: 'database',
  sourceDescription: 'Direkt aus der Datenbank gezählt.',
}

describe('ExplainableNumber', () => {
  it('renders the value', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    expect(screen.getByRole('button')).toHaveTextContent('42')
  })

  it('button has aria-expanded=false initially', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking opens popover dialog', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('popover has correct aria-label', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Erklärung für Vorfälle')
  })

  it('shows explanation label in popover header', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Vorfälle')).toBeInTheDocument()
  })

  it('shows source description', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Direkt aus der Datenbank gezählt.')).toBeInTheDocument()
  })

  it('close button hides popover', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape key closes popover', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('outside mousedown closes popover', () => {
    render(<ExplainableNumber value={42} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows formula section when provided', () => {
    const exp = { ...BASE_EXPLANATION, formula: 'total / n' }
    render(<ExplainableNumber value={5} explanation={exp} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('total / n')).toBeInTheDocument()
  })

  it('hides formula section when not provided', () => {
    render(<ExplainableNumber value={5} explanation={BASE_EXPLANATION} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Formel')).not.toBeInTheDocument()
  })

  it('shows data points when provided', () => {
    const exp = { ...BASE_EXPLANATION, dataPoints: [{ label: 'Wert A', value: 99 }] }
    render(<ExplainableNumber value={42} explanation={exp} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Wert A')).toBeInTheDocument()
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('shows interpretation when provided', () => {
    const exp = { ...BASE_EXPLANATION, interpretation: 'Hohe Aktivität' }
    render(<ExplainableNumber value={8} explanation={exp} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Hohe Aktivität')).toBeInTheDocument()
  })

  it('maps source to human-readable label (database)', () => {
    render(<ExplainableNumber value={1} explanation={{ ...BASE_EXPLANATION, source: 'database' }} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Datenbank')).toBeInTheDocument()
  })

  it('maps source to human-readable label (calculation)', () => {
    render(<ExplainableNumber value={1} explanation={{ ...BASE_EXPLANATION, source: 'calculation' }} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Berechnung')).toBeInTheDocument()
  })
})

// =============================================================================
// ExplainableMetric
// =============================================================================

describe('ExplainableMetric', () => {
  it('renders title and subtitle', () => {
    render(
      <ExplainableMetric
        title="Vorfälle gesamt"
        value={7}
        subtitle="Letzten 30 Tage"
        explanation={BASE_EXPLANATION}
      />
    )
    expect(screen.getByText('Vorfälle gesamt')).toBeInTheDocument()
    expect(screen.getByText('Letzten 30 Tage')).toBeInTheDocument()
  })

  it('renders value as clickable number', () => {
    render(
      <ExplainableMetric
        title="Vorfälle"
        value={5}
        subtitle="Sub"
        explanation={BASE_EXPLANATION}
      />
    )
    expect(screen.getByRole('button')).toHaveTextContent('5')
  })

  it('renders link overlay when href provided', () => {
    render(
      <ExplainableMetric
        title="Vorfälle"
        value={3}
        subtitle="Sub"
        explanation={BASE_EXPLANATION}
        href="/incidents"
      />
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/incidents')
  })
})

// =============================================================================
// ScoreExplanation
// =============================================================================

describe('ScoreExplanation', () => {
  it('renders simple inline text when showDetails=false', () => {
    render(<ScoreExplanation score={85} showDetails={false} />)
    expect(screen.getByText(/85%/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders clickable button when showDetails=true (default)', () => {
    render(<ScoreExplanation score={85} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('button shows score and label', () => {
    render(<ScoreExplanation score={85} />)
    expect(screen.getByRole('button')).toHaveTextContent('85% - Sehr gut')
  })

  it('button has aria-expanded=false initially', () => {
    render(<ScoreExplanation score={85} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking opens popover dialog', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('popover aria-label reflects type', () => {
    render(<ScoreExplanation score={85} type="compatibility" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Kompatibilität Erklärung')
  })

  it('popover aria-label for fit type', () => {
    render(<ScoreExplanation score={85} type="fit" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Passgenauigkeit Erklärung')
  })

  it('shows level description in popover', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Sehr hohe Übereinstimmung.')).toBeInTheDocument()
  })

  it('shows recommendation in popover', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Empfohlen.')).toBeInTheDocument()
  })

  it('close button closes popover', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button', { name: /85%/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape closes popover', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('outside mousedown closes popover', () => {
    render(<ScoreExplanation score={85} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows positive factors section', () => {
    render(<ScoreExplanation score={85} factors={[{ label: 'Gleiche Sprache', impact: 'positive' }]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Stärken')).toBeInTheDocument()
    expect(screen.getByText('Gleiche Sprache')).toBeInTheDocument()
  })

  it('shows negative factors section', () => {
    render(<ScoreExplanation score={85} factors={[{ label: 'Unterschiedlicher Schlafrhythmus', impact: 'negative' }]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Herausforderungen')).toBeInTheDocument()
    expect(screen.getByText('Unterschiedlicher Schlafrhythmus')).toBeInTheDocument()
  })

  it('shows factor detail in parentheses when provided', () => {
    render(
      <ScoreExplanation
        score={85}
        factors={[{ label: 'Sprache', impact: 'positive', detail: 'beide Deutsch' }]}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('(beide Deutsch)')).toBeInTheDocument()
  })

  it('hides factors sections when no factors', () => {
    render(<ScoreExplanation score={85} factors={[]} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Stärken')).not.toBeInTheDocument()
    expect(screen.queryByText('Herausforderungen')).not.toBeInTheDocument()
  })
})

// =============================================================================
// ScoreExplanationBadge
// =============================================================================

describe('ScoreExplanationBadge', () => {
  it('renders the score', () => {
    render(<ScoreExplanationBadge score={75} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows +N count for positive factors', () => {
    render(
      <ScoreExplanationBadge
        score={75}
        factors={[{ label: 'A', impact: 'positive' }, { label: 'B', impact: 'positive' }]}
      />
    )
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows -N count for negative factors', () => {
    render(
      <ScoreExplanationBadge
        score={75}
        factors={[{ label: 'A', impact: 'negative' }]}
      />
    )
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  it('shows both counts when factors are mixed', () => {
    render(
      <ScoreExplanationBadge
        score={75}
        factors={[
          { label: 'A', impact: 'positive' },
          { label: 'B', impact: 'negative' },
        ]}
      />
    )
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  it('shows no counts when no factors', () => {
    render(<ScoreExplanationBadge score={75} />)
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/-\d/)).not.toBeInTheDocument()
  })
})

// =============================================================================
// PeriodSelector
// =============================================================================

describe('PeriodSelector', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
    mockPathname = '/incidents'
  })

  it('renders all four period buttons', () => {
    render(<PeriodSelector currentDays={30} />)
    expect(screen.getByRole('button', { name: '7 Tage' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 Tage' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '60 Tage' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '90 Tage' })).toBeInTheDocument()
  })

  it('clicking 7-day navigates with ?days=7', () => {
    render(<PeriodSelector currentDays={30} />)
    fireEvent.click(screen.getByRole('button', { name: '7 Tage' }))
    expect(mockRouterPush).toHaveBeenCalledWith('/incidents?days=7')
  })

  it('clicking 30-day removes days param (it is the default)', () => {
    render(<PeriodSelector currentDays={7} />)
    fireEvent.click(screen.getByRole('button', { name: '30 Tage' }))
    expect(mockRouterPush).toHaveBeenCalledWith('/incidents')
  })

  it('clicking 90-day navigates with ?days=90', () => {
    render(<PeriodSelector currentDays={30} />)
    fireEvent.click(screen.getByRole('button', { name: '90 Tage' }))
    expect(mockRouterPush).toHaveBeenCalledWith('/incidents?days=90')
  })

  it('active button has distinct surface token for currentDays=7', () => {
    render(<PeriodSelector currentDays={7} />)
    expect(screen.getByRole('button', { name: '7 Tage' }).className).toContain('bg-ui-surface')
  })

  it('inactive buttons do NOT have active surface class', () => {
    render(<PeriodSelector currentDays={30} />)
    expect(screen.getByRole('button', { name: '7 Tage' }).className).not.toContain('bg-ui-surface')
  })
})

// =============================================================================
// ErrorBoundaryUI
// =============================================================================

describe('ErrorBoundaryUI', () => {
  it('renders error title', () => {
    render(<ErrorBoundaryUI description="Daten konnten nicht geladen werden." onRetry={jest.fn()} />)
    expect(screen.getByText('Fehler')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<ErrorBoundaryUI description="Daten konnten nicht geladen werden." onRetry={jest.fn()} />)
    expect(screen.getByText('Daten konnten nicht geladen werden.')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    render(<ErrorBoundaryUI description="Fehler." onRetry={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const onRetry = jest.fn()
    render(<ErrorBoundaryUI description="Fehler." onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders back link with default backHref="/"', () => {
    render(<ErrorBoundaryUI description="Fehler." onRetry={jest.fn()} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })

  it('renders back link with custom backHref', () => {
    render(<ErrorBoundaryUI description="Fehler." onRetry={jest.fn()} backHref="/housing" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/housing')
  })

  it('renders back link with default label', () => {
    render(<ErrorBoundaryUI description="Fehler." onRetry={jest.fn()} />)
    expect(screen.getByRole('link')).toHaveTextContent('Zum Dashboard')
  })

  it('renders back link with custom label', () => {
    render(<ErrorBoundaryUI description="Fehler." onRetry={jest.fn()} backLabel="Zurück zur Liste" />)
    expect(screen.getByRole('link')).toHaveTextContent('Zurück zur Liste')
  })
})
