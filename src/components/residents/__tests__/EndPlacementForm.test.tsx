import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EndPlacementForm } from '../EndPlacementForm'

// --- Suppress React 18 warning for Next.js server-action form props ---

const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Invalid value for prop') &&
      args[1] === '`action`'
    )
      return
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

// --- Mocks ---

vi.mock('@/lib/actions', async () => ({
  endPlacement: vi.fn(),
}))

vi.mock('@/lib/constants', async () => ({
  END_REASON_LABELS: {
    NATURAL: 'Regulär',
    CONFLICT: 'Konflikt',
    REQUEST: 'Auf Wunsch',
  },
  END_REASON_DESCRIPTIONS: {
    NATURAL: 'Planmässiges Ende der Unterbringung',
    CONFLICT: 'Beendigung aufgrund von Konflikten',
    REQUEST: 'Bewohner hat selbst um Verlegung gebeten',
  },
  COMPATIBILITY_GAP_LABELS: {
    NOISE: 'Lärm / Geräusche',
    CLEANLINESS: 'Sauberkeit / Ordnung',
  },
  PLACEMENT_ACTIONS_LABELS: {
    endTitle: 'Platzierung beenden',
    closeBtn: '✕ Schliessen',
    endWarningTitle: 'Achtung:',
    endWarning: 'Diese Aktion beendet die aktuelle Platzierung.',
    endReasonLabel: 'Grund *',
    conflictAnalysisTitle: 'Konfliktanalyse',
    conflictAnalysisDesc: 'Diese Angaben helfen, das Matching zu verbessern.',
    conflictCauseLabel: 'Hauptursache des Konflikts *',
    conflictPredictableLabel: 'War der Konflikt vorhersehbar?',
    conflictPredictableYes: 'Ja',
    conflictNoPredictable: 'Nein',
    conflictAlgorithmLabel: 'Hätte der Algorithmus diesen Konflikt vorhersagen können?',
    conflictScoreHint: (score: number) => `(Score war ${score}%)`,
    linkedIncidentLabel: 'Verknüpfter Vorfall',
    noLinkedIncident: 'Keinen Vorfall verknüpfen',
    incidentOptionalHint: 'Optional: Vorfall der zu dieser Beendigung geführt hat',
    endNotesLabel: 'Notizen',
    endNotesPlaceholder: 'Optionale Anmerkungen...',
    summaryLabel: 'Zusammenfassung:',
    endSummaryWithReason: (reason: string) => `Platzierung wird beendet (${reason}).`,
    endSummaryEmpty: 'Wählen Sie einen Grund, um die Beendigung zu bestätigen.',
    endBtn: 'Platzierung endgültig beenden',
    endBtnPending: 'Wird beendet...',
  },
  UI_LABELS: {
    selectPlaceholder: 'Bitte wählen...',
  },
}))

vi.mock('@/lib/config/thresholds', async () => ({
  ...(await vi.importActual<object>('@/lib/config/thresholds')),
  DISPLAY_LIMITS: { descriptionPreview: 50 },
}))

// --- Helpers ---

const BASE_PROPS = {
  placementId: 'placement-abc',
  residentId: 'resident-xyz',
  recentIncidents: [],
  selectedEndReason: '',
  onReasonChange: vi.fn(),
  onClose: vi.fn(),
}

function renderForm(overrides = {}) {
  return render(<EndPlacementForm {...BASE_PROPS} {...overrides} />)
}

// --- Tests ---

describe('EndPlacementForm', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Rendering ───────────────────────────────────────────────────────────

  it('renders the title and warning', () => {
    renderForm()
    expect(screen.getByText('Platzierung beenden')).toBeInTheDocument()
    expect(screen.getByText(/Diese Aktion beendet die aktuelle Platzierung/)).toBeInTheDocument()
  })

  it('renders all reason radio buttons', () => {
    renderForm()
    expect(screen.getByRole('radio', { name: /Regulär/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Konflikt/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Auf Wunsch/ })).toBeInTheDocument()
  })

  it('renders hidden inputs with correct placementId and residentId', () => {
    const { container } = renderForm()
    const hidden = container.querySelectorAll('input[type="hidden"]')
    const values = Array.from(hidden).map((el) => (el as HTMLInputElement).value)
    expect(values).toContain('placement-abc')
    expect(values).toContain('resident-xyz')
  })

  it('renders submit button', () => {
    renderForm()
    expect(
      screen.getByRole('button', { name: 'Platzierung endgültig beenden' }),
    ).toBeInTheDocument()
  })

  // ── Callbacks ───────────────────────────────────────────────────────────

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderForm({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /Schliessen/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onReasonChange with the correct key when a radio is clicked', () => {
    const onReasonChange = vi.fn()
    renderForm({ onReasonChange })
    fireEvent.click(screen.getByRole('radio', { name: /Auf Wunsch/ }))
    expect(onReasonChange).toHaveBeenCalledWith('REQUEST')
  })

  // ── Summary text ────────────────────────────────────────────────────────

  it('shows the empty summary when no reason is selected', () => {
    renderForm({ selectedEndReason: '' })
    expect(screen.getByText(/Wählen Sie einen Grund/)).toBeInTheDocument()
  })

  it('shows the reason-based summary when a reason is selected', () => {
    renderForm({ selectedEndReason: 'NATURAL' })
    expect(screen.getByText(/Platzierung wird beendet \(Regulär\)/)).toBeInTheDocument()
  })

  // ── Conflict section ────────────────────────────────────────────────────

  it('does not show the conflict analysis section when no reason is selected', () => {
    renderForm({ selectedEndReason: '' })
    expect(screen.queryByText('Konfliktanalyse')).not.toBeInTheDocument()
  })

  it('does not show conflict analysis for non-conflict reasons', () => {
    renderForm({ selectedEndReason: 'NATURAL' })
    expect(screen.queryByText('Konfliktanalyse')).not.toBeInTheDocument()
  })

  it('shows conflict analysis section when CONFLICT reason is selected', () => {
    renderForm({ selectedEndReason: 'CONFLICT' })
    expect(screen.getByText('Konfliktanalyse')).toBeInTheDocument()
    expect(screen.getByText('Hauptursache des Konflikts *')).toBeInTheDocument()
    expect(screen.getByText('War der Konflikt vorhersehbar?')).toBeInTheDocument()
  })

  it('shows cause options in the conflict section', () => {
    renderForm({ selectedEndReason: 'CONFLICT' })
    expect(screen.getByRole('option', { name: 'Lärm / Geräusche' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Sauberkeit / Ordnung' })).toBeInTheDocument()
  })

  // ── Score hint ──────────────────────────────────────────────────────────

  it('shows the score hint when compatibility score is below 60', () => {
    renderForm({ selectedEndReason: 'CONFLICT', initialCompatibilityScore: 45 })
    expect(screen.getByText('(Score war 45%)')).toBeInTheDocument()
  })

  it('does not show score hint when compatibility score is 60 or above', () => {
    renderForm({ selectedEndReason: 'CONFLICT', initialCompatibilityScore: 72 })
    expect(screen.queryByText(/Score war/)).not.toBeInTheDocument()
  })

  it('does not show score hint when no score is provided', () => {
    renderForm({ selectedEndReason: 'CONFLICT', initialCompatibilityScore: null })
    expect(screen.queryByText(/Score war/)).not.toBeInTheDocument()
  })

  // ── Incident selector ───────────────────────────────────────────────────

  it('does not show incident selector when recentIncidents is empty', () => {
    renderForm({ selectedEndReason: 'CONFLICT', recentIncidents: [] })
    expect(screen.queryByText('Verknüpfter Vorfall')).not.toBeInTheDocument()
  })

  it('shows incident selector when recentIncidents are provided', () => {
    const incidents = [
      {
        id: 'inc-1',
        date: new Date('2025-03-01'),
        type: 'CONFLICT',
        description: 'Lauter Streit in der Nacht zwischen Bewohnern',
      },
    ]
    renderForm({ selectedEndReason: 'CONFLICT', recentIncidents: incidents })
    expect(screen.getByText('Verknüpfter Vorfall')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Keinen Vorfall verknüpfen' })).toBeInTheDocument()
  })

  it('truncates long incident descriptions to DISPLAY_LIMITS.descriptionPreview', () => {
    const longDesc = 'A'.repeat(100)
    const incidents = [
      {
        id: 'inc-2',
        date: new Date('2025-04-15'),
        type: 'CONFLICT',
        description: longDesc,
      },
    ]
    renderForm({ selectedEndReason: 'CONFLICT', recentIncidents: incidents })
    // The rendered option shows description.slice(0, 50) + '...'
    const option = screen.getByRole('option', { name: /CONFLICT: AAAAAAAAAA/ })
    expect(option.textContent).not.toContain('A'.repeat(60))
  })
})
