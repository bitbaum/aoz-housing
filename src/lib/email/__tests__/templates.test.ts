/**
 * Tests for email template functions.
 * Verifies subject lines, HTML content, and edge cases.
 */

import {
  incidentFollowUpReminder,
  checkInReminder,
  lowSatisfactionAlert,
  newTransferRequestNotification,
} from '../templates'

// =============================================================================
// incidentFollowUpReminder
// =============================================================================

describe('incidentFollowUpReminder', () => {
  const incidents = [
    {
      id: 'clx1234567890abc',
      description: 'Lärmbeschwerde in der Nacht',
      severity: 'HIGH',
      housingUnitCode: 'WE-001',
      nextFollowUpDate: new Date('2026-02-20'),
    },
    {
      id: 'clx0987654321xyz',
      description: 'Sicherheitsbedenken gemeldet',
      severity: 'CRITICAL',
      housingUnitCode: 'WE-003',
      nextFollowUpDate: new Date('2026-02-18'),
    },
  ]

  test('returns subject with incident count', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.subject).toBe('[AOZ Housing] 2 überfällige Nachverfolgungen')
  })

  test('subject reflects single incident count', () => {
    const result = incidentFollowUpReminder([incidents[0]])
    expect(result.subject).toBe('[AOZ Housing] 1 überfällige Nachverfolgungen')
  })

  test('html contains incident descriptions', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.html).toContain('Lärmbeschwerde in der Nacht')
    expect(result.html).toContain('Sicherheitsbedenken gemeldet')
  })

  test('html contains housing unit codes', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.html).toContain('WE-001')
    expect(result.html).toContain('WE-003')
  })

  test('html contains severity labels in German', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.html).toContain('Hoch')
    expect(result.html).toContain('Kritisch')
  })

  test('html contains truncated incident IDs', () => {
    const result = incidentFollowUpReminder(incidents)
    // Last 8 chars of each id
    expect(result.html).toContain('67890abc')
    expect(result.html).toContain('54321xyz')
  })

  test('html contains formatted dates', () => {
    const result = incidentFollowUpReminder(incidents)
    // de-CH date format: DD.MM.YYYY
    expect(result.html).toContain('20.02.2026')
    expect(result.html).toContain('18.02.2026')
  })

  test('html contains table headers', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.html).toContain('Beschreibung')
    expect(result.html).toContain('Schweregrad')
    expect(result.html).toContain('Wohneinheit')
  })

  test('html contains footer', () => {
    const result = incidentFollowUpReminder(incidents)
    expect(result.html).toContain('automatisch vom AOZ Housing System')
  })

  test('handles empty array', () => {
    const result = incidentFollowUpReminder([])
    expect(result.subject).toBe('[AOZ Housing] 0 überfällige Nachverfolgungen')
    expect(result.html).toContain('0 Vorfall')
  })

  test('handles incident without housing unit code', () => {
    const result = incidentFollowUpReminder([{
      id: 'abc12345',
      description: 'Test',
      severity: 'HIGH',
      housingUnitCode: undefined,
      nextFollowUpDate: new Date('2026-01-01'),
    }])
    // Should show dash for missing unit code
    expect(result.html).toContain('-')
  })
})

// =============================================================================
// checkInReminder
// =============================================================================

describe('checkInReminder', () => {
  const overdueResidents = [
    {
      code: 'RES-001',
      supportLevel: 'INTENSIVE',
      lastCheckInDate: new Date('2026-02-01'),
      daysSinceLastCheckIn: 10,
    },
    {
      code: 'RES-002',
      supportLevel: 'ELEVATED',
      lastCheckInDate: new Date('2026-01-15'),
      daysSinceLastCheckIn: 20,
    },
    {
      code: 'RES-003',
      supportLevel: 'STANDARD',
      lastCheckInDate: null,
      daysSinceLastCheckIn: 45,
    },
  ]

  test('returns subject with resident count', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.subject).toBe('[AOZ Housing] 3 Check-ins überfällig')
  })

  test('html contains resident codes', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.html).toContain('RES-001')
    expect(result.html).toContain('RES-002')
    expect(result.html).toContain('RES-003')
  })

  test('html contains support level labels in German', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.html).toContain('Intensiv')
    expect(result.html).toContain('Erhöht')
    expect(result.html).toContain('Standard')
  })

  test('html contains days since last check-in', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.html).toContain('10 Tage')
    expect(result.html).toContain('20 Tage')
    expect(result.html).toContain('45 Tage')
  })

  test('shows "Nie" for null lastCheckInDate', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.html).toContain('Nie')
  })

  test('html contains table headers', () => {
    const result = checkInReminder(overdueResidents)
    expect(result.html).toContain('Bewohner')
    expect(result.html).toContain('Betreuungsstufe')
    expect(result.html).toContain('Letzter Check-in')
  })

  test('handles empty array', () => {
    const result = checkInReminder([])
    expect(result.subject).toBe('[AOZ Housing] 0 Check-ins überfällig')
    expect(result.html).toContain('0 Bewohner')
  })
})

// =============================================================================
// lowSatisfactionAlert
// =============================================================================

describe('lowSatisfactionAlert', () => {
  test('returns subject with resident code', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 1,
      concerns: 'Lärm nachts',
    })
    expect(result.subject).toBe('[AOZ Housing] Niedrige Zufriedenheit: RES-007')
  })

  test('html contains resident code and unit code', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 2,
    })
    expect(result.html).toContain('RES-007')
    expect(result.html).toContain('WE-002')
  })

  test('html contains star rating', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 2,
    })
    // 2 filled stars + 3 empty stars
    expect(result.html).toContain('\u2605\u2605\u2606\u2606\u2606')
    expect(result.html).toContain('2/5')
  })

  test('html contains concerns when provided', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 1,
      concerns: 'Küche ist oft schmutzig',
    })
    expect(result.html).toContain('Küche ist oft schmutzig')
    expect(result.html).toContain('Anliegen')
  })

  test('omits concerns section when not provided', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 1,
    })
    expect(result.html).not.toContain('Anliegen')
  })

  test('omits concerns section when null', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 1,
      concerns: null,
    })
    expect(result.html).not.toContain('Anliegen')
  })

  test('html contains review prompt', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-007',
      housingUnitCode: 'WE-002',
      overallSatisfaction: 2,
    })
    expect(result.html).toContain('Bitte prüfen Sie die Situation')
  })

  test('star rendering for rating 1', () => {
    const result = lowSatisfactionAlert({
      residentCode: 'RES-001',
      housingUnitCode: 'WE-001',
      overallSatisfaction: 1,
    })
    expect(result.html).toContain('\u2605\u2606\u2606\u2606\u2606')
    expect(result.html).toContain('1/5')
  })
})

// =============================================================================
// newTransferRequestNotification
// =============================================================================

describe('newTransferRequestNotification', () => {
  test('returns subject with resident code', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Konflikte mit Mitbewohnern',
    })
    expect(result.subject).toBe('[AOZ Housing] Neue Verlegungsanfrage: RES-010')
  })

  test('html contains all fields', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Konflikte mit Mitbewohnern',
    })
    expect(result.html).toContain('RES-010')
    expect(result.html).toContain('WE-001')
    expect(result.html).toContain('Konflikte mit Mitbewohnern')
  })

  test('html contains target unit when specified', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Wünscht ruhigere Umgebung',
      targetUnitCode: 'WE-005',
    })
    expect(result.html).toContain('WE-005')
    expect(result.html).toContain('Gewünschte Wohneinheit')
  })

  test('omits target unit line when not specified', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Persönliche Gründe',
    })
    expect(result.html).not.toContain('Gewünschte Wohneinheit')
  })

  test('html contains review prompt', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Test',
    })
    expect(result.html).toContain('Bitte prüfen Sie die Anfrage')
  })

  test('html contains footer', () => {
    const result = newTransferRequestNotification({
      residentCode: 'RES-010',
      currentUnitCode: 'WE-001',
      reason: 'Test',
    })
    expect(result.html).toContain('automatisch vom AOZ Housing System')
  })
})
