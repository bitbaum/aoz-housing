import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlacementActions } from '../PlacementActions'
import type { UnitWithSpots } from '@/lib/types'

// --- Mocks ---

// Suppress React 18 jsdom warning: Next.js server action functions passed to
// <form action> are valid in the App Router but React 18 DOM doesn't know that.
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Invalid value for prop') &&
      args[1] === '`action`'
    ) {
      return
    }
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

vi.mock('@/lib/actions', () => ({
  endPlacement: vi.fn(),
  transferPlacement: vi.fn(),
}))

vi.mock('next/link', () => {
  const MockLink = function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
  return { default: MockLink }
})

vi.mock('@/lib/config/placement-spots', () => ({
  SPOT_TYPE_LABELS: { BED: 'Bett', PRIVATE_ROOM: 'Einzelzimmer' },
  SPOT_TYPE_ICONS: { BED: '🛏', PRIVATE_ROOM: '🚪' },
}))

vi.mock('@/lib/constants', () => ({
  END_REASON_LABELS: {
    NATURAL_END: 'Natürliches Ende',
    CONFLICT: 'Konflikt',
    TRANSFER: 'Verlegung',
  },
  END_REASON_DESCRIPTIONS: {
    NATURAL_END: 'Reguläres Ablaufen der Unterbringung',
    CONFLICT: 'Konflikt mit Mitbewohnern',
    TRANSFER: 'Verlegung in andere Unterkunft',
  },
  COMPATIBILITY_GAP_LABELS: {
    LIFESTYLE: 'Lebensstil',
    LANGUAGE: 'Sprache',
  },
  PLACEMENT_ACTIONS_LABELS: {
    actionsTitle: 'Aktionen',
    transferTitle: 'Bewohner verlegen',
    endTitle: 'Platzierung beenden',
    conflictAnalysisTitle: 'Konfliktanalyse',
    conflictAnalysisDesc:
      'Diese Angaben helfen, das Matching zu verbessern und zukünftige Konflikte zu vermeiden.',
    conflictCauseLabel: 'Hauptursache des Konflikts *',
    conflictPredictableLabel: 'War der Konflikt vorhersehbar?',
    conflictAlgorithmLabel: 'Hätte der Algorithmus diesen Konflikt vorhersagen können?',
    linkedIncidentLabel: 'Verknüpfter Vorfall',
    noLinkedIncident: 'Keinen Vorfall verknüpfen',
    transferNotesLabel: 'Notizen',
    transferNotesPlaceholder: 'Optionale Anmerkungen zur Verlegung...',
    endNotesLabel: 'Notizen',
    endNotesPlaceholder: 'Optionale Anmerkungen...',
    endBtn: 'Platzierung endgültig beenden',
    conflictNoPredictable: 'Nein',
    checkinBtn: 'Check-in durchführen',
    transferToggleBtn: 'Verlegen',
    endToggleBtn: 'Beenden',
    closeBtn: '✕ Schliessen',
    transferConfirmBtn: 'Verlegen bestätigen',
    shortcutHint: 'Schnellzugriff: Alt+Shift+V (Verlegen), Alt+Shift+E (Beenden)',
    noEligibleUnits: 'Aktuell gibt es keine geeigneten Ziel-Unterkünfte für diesen Bewohner.',
    targetUnitLabel: 'Ziel-Unterkunft *',
    targetSpotLabel: 'Ziel-Platz *',
    selectSpot: 'Platz auswählen',
    selectUnitFirst: 'Zuerst Unterkunft wählen',
    medDocsSpotHint: 'Zeigt Plätze passend zur med. Dokumentation',
    noMedDocsSpotHint: 'Zeigt nur Betten (keine med. Dokumentation)',
    transferReasonLabel: 'Grund für Verlegung *',
    transferReasonHint: 'Wählen Sie den Hauptgrund für die Verlegung',
    summaryLabel: 'Zusammenfassung:',
    endWarningTitle: 'Achtung:',
    endWarning:
      'Diese Aktion beendet die aktuelle Platzierung. Der Bewohner wird als nicht platziert markiert.',
    endReasonLabel: 'Grund *',
    conflictPredictableYes: 'Ja',
    conflictScoreHint: (score: number) => `(Score war ${score}%)`,
    incidentOptionalHint: 'Optional: Vorfall der zu dieser Beendigung geführt hat',
    spotsAvailableCount: (count: number) => `${count} Plätze frei`,
    transferSummaryWithUnit: (unitCode: string) => `Bewohner wird in ${unitCode} verlegt.`,
    transferSummaryEmpty: 'Wählen Sie eine Ziel-Unterkunft, um die Verlegung zu bestätigen.',
    endSummaryWithReason: (reason: string) => `Diese Platzierung wird beendet (Grund: ${reason}).`,
    endSummaryEmpty: 'Wählen Sie einen Grund, um die Beendigung zu bestätigen.',
  },
  UI_LABELS: {
    selectPlaceholder: 'Bitte wählen',
  },
}))

vi.mock('@/lib/config/thresholds', async () => ({
  ...(await vi.importActual<Record<string, unknown>>('@/lib/config/thresholds')),
  DISPLAY_LIMITS: { descriptionPreview: 50 },
}))

vi.mock('../TransferRecommendations', () => ({
  TransferUnitSelector: ({
    eligibleUnits,
    onUnitSelect,
  }: {
    eligibleUnits: Array<{ id: string; code: string }>
    onUnitSelect: (id: string) => void
  }) => (
    <select aria-label="Ziel-Unterkunft auswählen" onChange={(e) => onUnitSelect(e.target.value)}>
      <option value="">Auswählen</option>
      {eligibleUnits.map((u) => (
        <option key={u.id} value={u.id}>
          {u.code}
        </option>
      ))}
    </select>
  ),
}))

// --- Fixtures ---

const UNIT_WITH_SPOTS: UnitWithSpots = {
  id: 'unit-2',
  code: 'HU-002',
  address: 'Teststrasse 2',
  spots: [{ id: 'spot-1', code: 'S1', type: 'BED' as const, label: 'Bett 1' }],
}

const DEFAULT_PROPS = {
  placementId: 'placement-1',
  residentId: 'resident-1',
  currentUnitId: 'unit-1',
  hasMedicalDocumentation: false,
  availableUnits: [UNIT_WITH_SPOTS],
  eligibleSpotTypes: ['BED'],
}

// --- Tests ---

describe('PlacementActions', () => {
  test('renders action buttons', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    expect(screen.getByRole('link', { name: /Check-in durchführen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verlegen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Beenden/i })).toBeInTheDocument()
  })

  test('check-in link points to correct placement', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    const link = screen.getByRole('link', { name: /Check-in durchführen/i })
    expect(link).toHaveAttribute('href', '/placements/placement-1/checkin')
  })

  test('clicking Verlegen shows transfer form', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verlegen bestätigen/i })).toBeInTheDocument()
  })

  test('clicking Beenden shows end form', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))

    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Platzierung endgültig beenden/i }),
    ).toBeInTheDocument()
  })

  test('clicking Verlegen hides Beenden form if open', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))
    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))
    expect(screen.queryByText(/Platzierung beenden/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
  })

  test('clicking Verlegen again toggles form off', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    const verlegenBtn = screen.getByRole('button', { name: /^🔄 Verlegen$/i })
    fireEvent.click(verlegenBtn)
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()

    fireEvent.click(verlegenBtn)
    expect(screen.queryByText(/Bewohner verlegen/i)).not.toBeInTheDocument()
  })

  test('shows warning when no eligible units available', () => {
    render(<PlacementActions {...DEFAULT_PROPS} availableUnits={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    expect(screen.getByText(/keine geeigneten Ziel-Unterkünfte/i)).toBeInTheDocument()
  })

  test('transfer submit button disabled when no unit selected', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))

    const submitBtn = screen.getByRole('button', { name: /Verlegen bestätigen/i })
    expect(submitBtn).toBeDisabled()
  })

  test('closes transfer form via X button', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Verlegen/i }))
    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /✕ Schliessen/i }))
    expect(screen.queryByText(/Bewohner verlegen/i)).not.toBeInTheDocument()
  })

  test('end form shows end reason radio buttons', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))

    expect(screen.getByLabelText(/Natürliches Ende/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Konflikt/i)).toBeInTheDocument()
  })

  test('shows conflict analysis fields when CONFLICT reason selected', () => {
    render(<PlacementActions {...DEFAULT_PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: /Beenden/i }))
    fireEvent.click(screen.getByLabelText(/Konflikt/i))

    expect(screen.getByText(/Konfliktanalyse/i)).toBeInTheDocument()
    // Label exists (select has no id, so we check by text instead of getByLabelText)
    expect(screen.getByText(/Hauptursache des Konflikts/i)).toBeInTheDocument()
  })

  test('opens transfer form when initialAction is transfer', () => {
    render(<PlacementActions {...DEFAULT_PROPS} initialAction="transfer" />)

    expect(screen.getByText(/Bewohner verlegen/i)).toBeInTheDocument()
  })

  test('opens end form when initialAction is end', () => {
    render(<PlacementActions {...DEFAULT_PROPS} initialAction="end" />)

    expect(screen.getByText(/Platzierung beenden/i)).toBeInTheDocument()
  })
})
