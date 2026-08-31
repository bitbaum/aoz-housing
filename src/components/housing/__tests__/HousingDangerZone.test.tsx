import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/constants/labels', () => ({
  HOUSING_DANGER_ZONE_LABELS: {
    title: 'Housing Danger Zone',
    description: 'Nur für Test-Unterkünfte.',
    notEligible: 'Nicht als Test markiert.',
    blockerReportTitle: 'Blocker:',
    noDetails: 'Keine Details',
    copyReport: 'Report kopieren',
    copiedToClipboard: 'Kopiert',
    confirmPlaceholder: 'Bestätigung: DELETE',
    reasonPlaceholder: 'Grund (mind. 10 Zeichen)',
    deleteFailed: 'Fehlgeschlagen',
    deleteSuccess: 'Unterkunft gelöscht',
    deleteButton: 'Endgültig löschen',
  },
  HOUSING_BLOCKER_LABELS: { placements: 'Platzierungen', incidents: 'Vorfälle' },
}))

vi.mock('@/lib/actions', () => ({
  hardDeleteHousingUnitProtected: vi.fn().mockResolvedValue({ success: false }),
}))

import { HousingDangerZone } from '../HousingDangerZone'

describe('HousingDangerZone', () => {
  it('renders section title', () => {
    render(<HousingDangerZone housingUnitId="unit-1" code="HU-TEST" />)
    expect(screen.getByText('Housing Danger Zone')).toBeInTheDocument()
  })

  it('shows notEligible message for a production code', () => {
    render(<HousingDangerZone housingUnitId="unit-1" code="HU-001" />)
    expect(screen.getByText('Nicht als Test markiert.')).toBeInTheDocument()
  })

  it('hides notEligible message for a test code', () => {
    render(<HousingDangerZone housingUnitId="unit-1" code="HU-TEST-01" />)
    expect(screen.queryByText('Nicht als Test markiert.')).not.toBeInTheDocument()
  })

  it('delete button is disabled for non-test code', () => {
    render(<HousingDangerZone housingUnitId="unit-1" code="HU-001" />)
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeDisabled()
  })

  it('renders description', () => {
    render(<HousingDangerZone housingUnitId="unit-1" code="HU-TEST" />)
    expect(screen.getByText('Nur für Test-Unterkünfte.')).toBeInTheDocument()
  })
})
