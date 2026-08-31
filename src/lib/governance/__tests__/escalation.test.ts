import { determineEntryStage, nextRung, recommendNextStep, type AgreementLike } from '../escalation'

const NOW = new Date('2026-03-20T12:00:00Z')

function daysAgo(days: number): Date {
  const d = new Date(NOW)
  d.setDate(d.getDate() - days)
  return d
}

describe('determineEntryStage', () => {
  it('starts an ordinary low-severity conflict with a direct conversation', () => {
    const entry = determineEntryStage({
      category: 'INTERPERSONAL',
      severity: 'LOW',
      type: 'NOISE_COMPLAINT',
    })

    expect(entry.stage).toBe('SELF_RESOLUTION')
  })

  it('never asks the people involved to sort out a safety report themselves', () => {
    const entry = determineEntryStage({
      category: 'SAFETY',
      severity: 'LOW', // deliberately understated by whoever logged it
      type: 'SAFETY_CONCERN',
    })

    expect(entry.stage).toBe('STAFF_MEDIATION')
    expect(entry.reason).toContain('Sicherheitsmeldung')
  })

  it('keeps a critical safety incident at the formal rung rather than stepping it down', () => {
    const entry = determineEntryStage({
      category: 'SAFETY',
      severity: 'CRITICAL',
      type: 'SAFETY_CONCERN',
    })

    expect(entry.stage).toBe('FORMAL_MEASURE')
  })

  it('escalates a high-severity interpersonal conflict straight to staff mediation', () => {
    const entry = determineEntryStage({
      category: 'INTERPERSONAL',
      severity: 'HIGH',
      type: 'PERSONAL_CONFLICT',
    })

    expect(entry.stage).toBe('STAFF_MEDIATION')
  })

  it('routes a safety-typed incident to staff even when filed under another category', () => {
    const entry = determineEntryStage({
      category: 'INTERPERSONAL',
      severity: 'MEDIUM',
      type: 'SAFETY_CONCERN',
    })

    expect(entry.stage).toBe('STAFF_MEDIATION')
  })
})

describe('nextRung', () => {
  it('walks up the ladder one step at a time', () => {
    expect(nextRung('SELF_RESOLUTION')).toBe('PEER_MEDIATION')
    expect(nextRung('PEER_MEDIATION')).toBe('STAFF_MEDIATION')
    expect(nextRung('STAFF_MEDIATION')).toBe('FORMAL_MEASURE')
  })

  it('stops at the top instead of wrapping around', () => {
    expect(nextRung('FORMAL_MEASURE')).toBe('FORMAL_MEASURE')
  })
})

describe('recommendNextStep', () => {
  const incident = (
    stage: Parameters<typeof recommendNextStep>[0]['resolutionStage'],
    enteredDaysAgo: number,
  ) => ({
    resolutionStage: stage,
    stageEnteredAt: daysAgo(enteredDaysAgo),
    resolvedAt: null,
  })

  const agreement = (status: AgreementLike['status'], reviewDaysAgo: number): AgreementLike => ({
    status,
    reviewDate: daysAgo(reviewDaysAgo),
  })

  it('escalates when an agreement was broken', () => {
    const rec = recommendNextStep(incident('SELF_RESOLUTION', 3), [agreement('BROKEN', 1)], NOW)

    expect(rec.shouldEscalate).toBe(true)
    expect(rec.recommendedStage).toBe('PEER_MEDIATION')
    // Escalation must not read as blame.
    expect(rec.reason).toContain('keine Strafe')
  })

  it('closes the conflict when the agreement held', () => {
    const rec = recommendNextStep(incident('STAFF_MEDIATION', 20), [agreement('HELD', 2)], NOW)

    expect(rec.recommendedStage).toBe('CLOSED')
    expect(rec.shouldEscalate).toBe(false)
  })

  it('does not escalate a step that is merely late', () => {
    // Slow is not the same as failed — flag it, do not punish it.
    const rec = recommendNextStep(incident('SELF_RESOLUTION', 30), [], NOW)

    expect(rec.isOverdue).toBe(true)
    expect(rec.daysOverdue).toBeGreaterThan(0)
    expect(rec.shouldEscalate).toBe(false)
    expect(rec.recommendedStage).toBe('SELF_RESOLUTION')
  })

  it('waits while an accepted agreement is still running', () => {
    const future = new Date(NOW)
    future.setDate(future.getDate() + 5)
    const rec = recommendNextStep(
      incident('STAFF_MEDIATION', 2),
      [{ status: 'ACCEPTED', reviewDate: future }],
      NOW,
    )

    expect(rec.shouldEscalate).toBe(false)
    expect(rec.reason).toContain('Abmachung läuft')
  })

  it('prompts a review when an agreement is past its review date', () => {
    const rec = recommendNextStep(incident('STAFF_MEDIATION', 30), [agreement('ACCEPTED', 20)], NOW)

    expect(rec.reason).toContain('überfällig')
    expect(rec.shouldEscalate).toBe(false)
  })

  it('lets a broken agreement outweigh an earlier one that held', () => {
    const rec = recommendNextStep(
      incident('PEER_MEDIATION', 5),
      [agreement('HELD', 30), agreement('BROKEN', 2)],
      NOW,
    )

    expect(rec.shouldEscalate).toBe(true)
    expect(rec.recommendedStage).toBe('STAFF_MEDIATION')
  })

  it('reports a closed conflict as needing nothing', () => {
    const rec = recommendNextStep(incident('CLOSED', 1), [], NOW)

    expect(rec.shouldEscalate).toBe(false)
    expect(rec.isOverdue).toBe(false)
  })
})
