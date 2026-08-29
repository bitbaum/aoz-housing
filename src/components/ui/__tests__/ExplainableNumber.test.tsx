import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExplainableNumber, ExplainableMetric } from '../ExplainableNumber'
import type { NumberExplanation } from '../ExplainableNumber'

// --- Mocks ---

jest.mock('@/lib/constants/labels', () => ({
  UI_LABELS: { close: 'Schliessen' },
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
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    href: string
    children?: React.ReactNode
    className?: string
    'aria-label'?: string
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

// --- Helpers ---

function makeExplanation(overrides: Partial<NumberExplanation> = {}): NumberExplanation {
  return {
    label: 'Belegungsrate',
    source: 'database',
    sourceDescription: 'Direkt aus der Datenbank gelesen.',
    ...overrides,
  }
}

function renderNumber(value: string | number = 42, overrides: Partial<NumberExplanation> = {}) {
  return render(<ExplainableNumber value={value} explanation={makeExplanation(overrides)} />)
}

// =============================================================================
// ExplainableNumber — closed state
// =============================================================================

describe('ExplainableNumber (closed)', () => {
  it('renders the value', () => {
    renderNumber(42)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a button trigger', () => {
    renderNumber(42)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('trigger has aria-expanded=false initially', () => {
    renderNumber(42)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
  })

  it('dialog is not visible initially', () => {
    renderNumber(42)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders string values', () => {
    renderNumber('85%')
    expect(screen.getByText('85%')).toBeInTheDocument()
  })
})

// =============================================================================
// ExplainableNumber — open state
// =============================================================================

describe('ExplainableNumber (open)', () => {
  function open(overrides: Partial<NumberExplanation> = {}) {
    renderNumber(42, overrides)
    fireEvent.click(screen.getByRole('button'))
  }

  it('opens dialog on trigger click', () => {
    open()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('trigger has aria-expanded=true when open', () => {
    open()
    // The trigger button's accessible name is the displayed value ("42"); the dialog has the aria-label
    expect(screen.getByRole('button', { name: '42' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('dialog has correct aria-label', () => {
    open()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Erklärung für Belegungsrate')
  })

  it('shows explanation label', () => {
    open()
    expect(screen.getByText('Belegungsrate')).toBeInTheDocument()
  })

  it('shows source description', () => {
    open()
    expect(screen.getByText('Direkt aus der Datenbank gelesen.')).toBeInTheDocument()
  })

  it('shows source label for database', () => {
    open()
    expect(screen.getByText('Datenbank')).toBeInTheDocument()
  })

  it('shows source label for calculation', () => {
    open({ source: 'calculation' })
    expect(screen.getByText('Berechnung')).toBeInTheDocument()
  })

  it('shows source label for derived', () => {
    open({ source: 'derived' })
    expect(screen.getByText('Abgeleitet')).toBeInTheDocument()
  })

  it('renders close button', () => {
    open()
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('close button hides dialog', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking trigger again closes dialog', () => {
    renderNumber(42)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button', { name: '42' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ── Optional sections ──────────────────────────────────────────────────────

  it('shows formula section when formula provided', () => {
    open({ formula: 'a / b * 100' })
    expect(screen.getByText('Formel')).toBeInTheDocument()
    expect(screen.getByText('a / b * 100')).toBeInTheDocument()
  })

  it('hides formula section when formula not provided', () => {
    open()
    expect(screen.queryByText('Formel')).not.toBeInTheDocument()
  })

  it('shows data points when provided', () => {
    open({
      dataPoints: [
        { label: 'Belegt', value: 8 },
        { label: 'Gesamt', value: 10 },
      ],
    })
    expect(screen.getByText('Datenpunkte')).toBeInTheDocument()
    expect(screen.getByText('Belegt')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Gesamt')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('hides data points section when not provided', () => {
    open()
    expect(screen.queryByText('Datenpunkte')).not.toBeInTheDocument()
  })

  it('shows interpretation when provided', () => {
    open({ interpretation: 'Hohe Auslastung, bitte prüfen.' })
    expect(screen.getByText('Interpretation')).toBeInTheDocument()
    expect(screen.getByText('Hohe Auslastung, bitte prüfen.')).toBeInTheDocument()
  })

  it('hides interpretation when not provided', () => {
    open()
    expect(screen.queryByText('Interpretation')).not.toBeInTheDocument()
  })
})

// =============================================================================
// Keyboard / click-outside interactions
// =============================================================================

describe('ExplainableNumber (interactions)', () => {
  it('Escape key closes the dialog', () => {
    renderNumber(42)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Escape does nothing when dialog is closed', () => {
    renderNumber(42)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mousedown outside closes dialog', () => {
    renderNumber(42)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mousedown inside dialog does not close it', () => {
    renderNumber(42)
    fireEvent.click(screen.getByRole('button'))
    const dialog = screen.getByRole('dialog')
    fireEvent.mouseDown(dialog)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

// =============================================================================
// ExplainableMetric
// =============================================================================

describe('ExplainableMetric', () => {
  const BASE = {
    title: 'Belegung',
    value: 8,
    subtitle: '80% ausgelastet',
    explanation: makeExplanation(),
  }

  it('renders title', () => {
    render(<ExplainableMetric {...BASE} />)
    expect(screen.getByText('Belegung')).toBeInTheDocument()
  })

  it('renders value', () => {
    render(<ExplainableMetric {...BASE} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<ExplainableMetric {...BASE} />)
    expect(screen.getByText('80% ausgelastet')).toBeInTheDocument()
  })

  it('renders an anchor link when href provided', () => {
    render(<ExplainableMetric {...BASE} href="/housing" />)
    expect(screen.getByRole('link', { name: /Belegung.*Details/ })).toHaveAttribute(
      'href',
      '/housing',
    )
  })

  it('does not render anchor link when no href', () => {
    render(<ExplainableMetric {...BASE} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('opens explanation dialog when value clicked', () => {
    render(<ExplainableMetric {...BASE} />)
    fireEvent.click(screen.getByText('8'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
