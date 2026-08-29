/**
 * Tests for the resident-facing report list (lib/reports/).
 *
 * Two properties matter here: a resident sees BOTH kinds of report they filed,
 * and the answer staff wrote reaches them. Either one missing turns the portal
 * into a place where reports disappear.
 */

import { mergeResidentReports, fromIncident, fromMaintenanceRequest } from '../resident-reports'
import { isMaintenanceType, maintenanceCategoryFor, maintenancePriorityFor } from '../routing'

const incident = (over: Partial<Parameters<typeof fromIncident>[0]> = {}) => ({
  id: 'inc-1',
  type: 'NOISE_COMPLAINT',
  description: 'Laute Musik',
  date: new Date('2026-08-10T10:00:00Z'),
  resolvedAt: null,
  resolution: null,
  ...over,
})

const maintenance = (over: Partial<Parameters<typeof fromMaintenanceRequest>[0]> = {}) => ({
  id: 'mr-1',
  category: 'PLUMBING',
  description: 'Wasserhahn tropft',
  createdAt: new Date('2026-08-12T10:00:00Z'),
  status: 'OPEN' as const,
  resolution: null,
  ...over,
})

describe('routing a report to the right desk', () => {
  it('recognises the maintenance incident types', () => {
    expect(isMaintenanceType('PLUMBING')).toBe(true)
    expect(isMaintenanceType('NOISE_COMPLAINT')).toBe(false)
  })

  it('maps every maintenance type onto a board category', () => {
    expect(maintenanceCategoryFor('PLUMBING')).toBe('PLUMBING')
    // The two names that differ between the enums — the reason a mapping exists.
    expect(maintenanceCategoryFor('SECURITY_SYSTEM')).toBe('SECURITY')
    expect(maintenanceCategoryFor('GENERAL_MAINTENANCE')).toBe('OTHER')
  })

  it('translates severity into the maintenance urgency scale', () => {
    expect(maintenancePriorityFor('LOW')).toBe('LOW')
    expect(maintenancePriorityFor('MEDIUM')).toBe('NORMAL')
    expect(maintenancePriorityFor('HIGH')).toBe('HIGH')
    expect(maintenancePriorityFor('CRITICAL')).toBe('URGENT')
  })
})

describe('mergeResidentReports', () => {
  it('shows both kinds of report in one list', () => {
    const merged = mergeResidentReports([incident()], [maintenance()], 10)
    expect(merged.map((r) => r.kind).sort()).toEqual(['INCIDENT', 'MAINTENANCE'])
  })

  it('carries the staff answer through — a stored resolution nobody sees is no answer', () => {
    const merged = mergeResidentReports(
      [],
      [maintenance({ status: 'COMPLETED', resolution: 'Dichtung ersetzt.' })],
      10,
    )
    expect(merged[0].answer).toBe('Dichtung ersetzt.')
    expect(merged[0].isDone).toBe(true)
  })

  it('puts unanswered reports first — that is what the resident came for', () => {
    const done = maintenance({
      id: 'mr-done',
      status: 'COMPLETED',
      createdAt: new Date('2026-08-13T10:00:00Z'),
    })
    const open = incident({ id: 'inc-open', date: new Date('2026-08-01T10:00:00Z') })
    const merged = mergeResidentReports([open], [done], 10)
    expect(merged.map((r) => r.id)).toEqual(['inc-open', 'mr-done'])
  })

  it('orders open reports newest first', () => {
    const older = incident({ id: 'old', date: new Date('2026-08-01T10:00:00Z') })
    const newer = incident({ id: 'new', date: new Date('2026-08-11T10:00:00Z') })
    expect(mergeResidentReports([older, newer], [], 10).map((r) => r.id)).toEqual(['new', 'old'])
  })

  it('treats a cancelled request as closed, not as still pending', () => {
    const merged = mergeResidentReports([], [maintenance({ status: 'CANCELLED' })], 10)
    expect(merged[0].isDone).toBe(true)
  })

  it('counts an in-progress request as still open', () => {
    const merged = mergeResidentReports([], [maintenance({ status: 'IN_PROGRESS' })], 10)
    expect(merged[0].isDone).toBe(false)
  })

  it('respects the display limit across BOTH sources, not per source', () => {
    const merged = mergeResidentReports(
      [incident({ id: 'a' }), incident({ id: 'b' })],
      [maintenance({ id: 'c' }), maintenance({ id: 'd' })],
      3,
    )
    expect(merged).toHaveLength(3)
  })

  /**
   * The bug this pins: a resident filed a report and could not find it again.
   *
   * The list existed only as a five-item preview on the dashboard, so the sixth
   * report onward was not reachable from anywhere in the product — and a report
   * you cannot find is indistinguishable from one that was never saved. The
   * fix is a page that asks for everything, which only works if "everything"
   * is expressible.
   */
  it('returns every report when no limit is given', () => {
    const merged = mergeResidentReports(
      [incident({ id: 'a' }), incident({ id: 'b' }), incident({ id: 'c' })],
      [maintenance({ id: 'd' }), maintenance({ id: 'e' }), maintenance({ id: 'f' })],
    )

    expect(merged).toHaveLength(6)
  })

  it('keeps a limit of zero meaning zero, not "no limit"', () => {
    // `limit ?? all` would turn 0 into everything — the kind of falsy-check
    // slip that shows up as a page ignoring its own cap.
    expect(mergeResidentReports([incident()], [maintenance()], 0)).toHaveLength(0)
  })

  it('lets the preview and the full list agree on what is first', () => {
    // The dashboard slices the merged list; the page shows it whole. If the
    // two ordered differently, the preview would advertise a report that is
    // not at the top of the page it links to.
    const incidents = [incident({ id: 'a' }), incident({ id: 'b', resolvedAt: new Date() })]
    const requests = [maintenance({ id: 'c' })]

    const full = mergeResidentReports(incidents, requests)
    const preview = mergeResidentReports(incidents, requests, 2)

    expect(preview).toEqual(full.slice(0, 2))
  })
})
