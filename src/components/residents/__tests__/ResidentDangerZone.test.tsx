import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', async () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/constants', async () => ({
  DANGER_ZONE_LABELS: {
    title: 'Danger Zone',
    description: 'Nur für Test-Bewohner.',
    notTestResident: 'Nicht als Test markiert.',
    blockerReport: 'Blocker:',
    noDetails: 'Keine Details',
    copiedToClipboard: 'Kopiert',
    copyReport: 'Report kopieren',
    confirmLabel: 'Bestätigung: DELETE',
    reasonLabel: 'Grund (mind. 10 Zeichen)',
    deleteFailed: 'Fehlgeschlagen',
    deleteSuccess: 'Bewohner gelöscht',
    deleteButton: 'Endgültig löschen',
    blockers: {
      placements: 'Platzierungen',
      incidentsReported: 'Gemeldete Vorfälle',
      incidentsSubject: 'Vorfälle als Betroffener',
      incidentInvolvements: 'Beteiligungen',
      maintenanceReports: 'Wartungsmeldungen',
      compatibilityAssessments: 'Kompatibilitätsanalysen',
    },
  },
}))

vi.mock('@/lib/actions', async () => ({
  hardDeleteResidentProtected: vi.fn().mockResolvedValue({ success: false }),
}))

import { ResidentDangerZone } from '../ResidentDangerZone'

describe('ResidentDangerZone', () => {
  it('renders section title', () => {
    render(<ResidentDangerZone residentId="res-1" residentCode="RES-001" />)
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
  })

  it('shows notEligible message for a production code', () => {
    render(<ResidentDangerZone residentId="res-1" residentCode="RES-001" />)
    expect(screen.getByText('Nicht als Test markiert.')).toBeInTheDocument()
  })

  it('hides notEligible message for a test code', () => {
    render(<ResidentDangerZone residentId="res-1" residentCode="RES-TEST-01" />)
    expect(screen.queryByText('Nicht als Test markiert.')).not.toBeInTheDocument()
  })

  it('hides notEligible message for a demo code', () => {
    render(<ResidentDangerZone residentId="res-1" residentCode="RES-DEMO-01" />)
    expect(screen.queryByText('Nicht als Test markiert.')).not.toBeInTheDocument()
  })

  it('delete button is disabled for non-test code', () => {
    render(<ResidentDangerZone residentId="res-1" residentCode="RES-001" />)
    expect(screen.getByRole('button', { name: 'Endgültig löschen' })).toBeDisabled()
  })
})
