'use server'

/**
 * Governance server actions (staff side).
 *
 * Thin HTTP/auth layer over the pure logic in lib/governance — these functions
 * do I/O and permission checks; every rule about *what may happen* lives in the
 * domain module and is unit-tested there.
 */

import { revalidatePath } from 'next/cache'
import {
  db,
  agreementParty,
  conflictAgreement,
  houseRule,
  incident,
  incidentFollowUp,
  proposal,
} from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import {
  advanceStageSchema,
  createAgreementSchema,
  orgRuleSchema,
  reviewAgreementSchema,
  staffConfirmProposalSchema,
  unitRuleSchema,
  updateOrgRuleSchema,
  type AdvanceStageInput,
  type CreateAgreementInput,
  type OrgRuleInput,
  type ReviewAgreementInput,
  type StaffConfirmProposalInput,
  type UnitRuleInput,
  type UpdateOrgRuleInput,
} from '@/lib/validation/governance'
import { BRAND } from '@/lib/config/brand'
import { checkUnitLegislation } from '@/lib/governance/rules'
import { adoptProposal, closeProposal } from '@/lib/governance/lifecycle'
import { syncOrgRules } from '@/lib/governance/sync-org-rules'
import { AGREEMENT_CONFIG } from '@/lib/config/conflict-resolution'

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string }

// =============================================================================
// AOZ RULES
// =============================================================================

/** Re-import the AOZ baseline catalog. Idempotent; safe to run on every deploy. */
export async function syncOrgRuleCatalog(): Promise<
  ActionResult<{ created: number; amended: number }>
> {
  const user = await requireStaffAuth()
  try {
    const result = await syncOrgRules(db)

    await logAudit({
      action: 'UPDATE',
      entity: 'HOUSE_RULE',
      entityId: 'org-catalog',
      userId: user.id,
      changes: {
        created: result.created,
        amended: result.amended,
        amendedKeys: result.amendedKeys,
      },
    })

    revalidatePath('/rules')
    return { success: true, data: { created: result.created, amended: result.amended } }
  } catch (error) {
    logger.errorWithCause(`Failed to sync ${BRAND.orgName} rule catalog`, error)
    return { success: false, error: ERROR_MESSAGES.RULE_SYNC_ERROR }
  }
}

export async function createOrgRule(input: OrgRuleInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaffAuth()
  const parsed = orgRuleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    const [rule] = await db
      .insert(houseRule)
      .values({ ...parsed.data, scope: 'ORG', status: 'ACTIVE', version: 1 })
      .returning()

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSE_RULE',
      entityId: rule.id,
      userId: user.id,
      changes: { scope: 'ORG', key: parsed.data.key },
    })

    revalidatePath('/rules')
    return { success: true, data: { id: rule.id } }
  } catch (error) {
    logger.errorWithCause(`Failed to create ${BRAND.orgName} rule`, error, { key: parsed.data.key })
    return { success: false, error: ERROR_MESSAGES.RULE_SAVE_ERROR }
  }
}

/**
 * Amending a rule bumps its version, which asks every resident bound by it to
 * read it again. Editing wording silently would leave people held to text they
 * never saw.
 */
export async function updateOrgRule(input: UpdateOrgRuleInput): Promise<ActionResult> {
  const user = await requireStaffAuth()
  const parsed = updateOrgRuleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    const existing = await db.query.houseRule.findFirst({
      where: eq(houseRule.id, parsed.data.ruleId),
    })
    if (!existing) return { success: false, error: ERROR_MESSAGES.RULE_NOT_FOUND }

    const contentChanged =
      existing.title !== parsed.data.title || existing.body !== parsed.data.body

    await db
      .update(houseRule)
      .set({
        category: parsed.data.category,
        title: parsed.data.title,
        body: parsed.data.body,
        delegation: parsed.data.delegation,
        version: contentChanged ? existing.version + 1 : existing.version,
      })
      .where(eq(houseRule.id, parsed.data.ruleId))

    await logAudit({
      action: 'UPDATE',
      entity: 'HOUSE_RULE',
      entityId: parsed.data.ruleId,
      userId: user.id,
      changes: {
        contentChanged,
        newVersion: contentChanged ? existing.version + 1 : existing.version,
      },
    })

    revalidatePath('/rules')
    return { success: true }
  } catch (error) {
    logger.errorWithCause(`Failed to update ${BRAND.orgName} rule`, error, {
      ruleId: parsed.data.ruleId,
    })
    return { success: false, error: ERROR_MESSAGES.RULE_SAVE_ERROR }
  }
}

export async function archiveRule(ruleId: string): Promise<ActionResult> {
  const user = await requireStaffAuth()
  try {
    const [archived] = await db
      .update(houseRule)
      .set({ status: 'ARCHIVED', effectiveUntil: new Date() })
      .where(eq(houseRule.id, ruleId))
      .returning({ id: houseRule.id })
    // Prisma threw on a missing rule; keep that outcome for a bad id.
    if (!archived) return { success: false, error: ERROR_MESSAGES.ARCHIVE_ERROR }

    await logAudit({ action: 'ARCHIVE', entity: 'HOUSE_RULE', entityId: ruleId, userId: user.id })

    revalidatePath('/rules')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to archive rule', error, { ruleId })
    return { success: false, error: ERROR_MESSAGES.ARCHIVE_ERROR }
  }
}

/**
 * Staff-set house rule. For units too small to hold a meaningful vote, and for
 * writing down what a house already agreed verbally.
 */
export async function createUnitRuleAsStaff(
  input: UnitRuleInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaffAuth()
  const parsed = unitRuleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    const parent = await db.query.houseRule.findFirst({
      where: eq(houseRule.id, parsed.data.parentRuleId),
    })
    if (!parent) return { success: false, error: ERROR_MESSAGES.RULE_NOT_FOUND }

    // Same gate as a resident proposal: staff cannot override an AOZ rule either.
    const check = checkUnitLegislation(parent)
    if (!check.allowed) return { success: false, error: check.reason }

    const [rule] = await db
      .insert(houseRule)
      .values({
        scope: 'UNIT',
        housingUnitId: parsed.data.housingUnitId,
        parentRuleId: parsed.data.parentRuleId,
        category: parent.category,
        title: parsed.data.title,
        body: parsed.data.body,
        delegation: parent.delegation,
        status: 'ACTIVE',
        version: 1,
        createdByStaff: user.name,
      })
      .returning()

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSE_RULE',
      entityId: rule.id,
      userId: user.id,
      changes: { scope: 'UNIT', housingUnitId: parsed.data.housingUnitId },
    })

    revalidatePath(`/housing/${parsed.data.housingUnitId}`)
    return { success: true, data: { id: rule.id } }
  } catch (error) {
    logger.errorWithCause('Failed to create unit rule', error)
    return { success: false, error: ERROR_MESSAGES.RULE_SAVE_ERROR }
  }
}

// =============================================================================
// PROPOSALS — closing a vote and adopting the result
// =============================================================================

/**
 * Tally a proposal whose voting window has closed and move it to its outcome.
 * The tally/adopt logic lives in lib/governance/lifecycle so the cron and the
 * portal reach the same result by the same path.
 */
export async function closeProposalVoting(
  proposalId: string,
): Promise<ActionResult<{ status: string }>> {
  const user = await requireStaffAuth()

  try {
    const status = await closeProposal(proposalId)
    if (!status) return { success: false, error: ERROR_MESSAGES.PROPOSAL_ALREADY_DECIDED }

    await logAudit({
      action: 'UPDATE',
      entity: 'PROPOSAL',
      entityId: proposalId,
      userId: user.id,
      changes: { status },
    })

    revalidatePath('/rules/decisions')
    return { success: true, data: { status } }
  } catch (error) {
    logger.errorWithCause('Failed to close proposal voting', error, { proposalId })
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
}

/** Staff confirmation for advisory decisions and rules claiming to strengthen an AOZ rule. */
export async function confirmProposal(input: StaffConfirmProposalInput): Promise<ActionResult> {
  const user = await requireStaffAuth()
  const parsed = staffConfirmProposalSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    // Atomic guard — two staff members must not confirm and veto the same row.
    const updated = await db
      .update(proposal)
      .set({
        status: parsed.data.decision === 'CONFIRMED' ? 'ACCEPTED' : 'VETOED',
        staffDecision: parsed.data.decision,
        staffNotes: parsed.data.staffNotes,
        staffUserId: user.id,
        staffDecidedAt: new Date(),
      })
      .where(
        and(
          eq(proposal.id, parsed.data.proposalId),
          eq(proposal.status, 'NEEDS_STAFF_CONFIRMATION'),
        ),
      )
      .returning({ id: proposal.id })

    if (updated.length === 0) {
      return { success: false, error: ERROR_MESSAGES.PROPOSAL_ALREADY_DECIDED }
    }

    if (parsed.data.decision === 'CONFIRMED') {
      await adoptProposal(parsed.data.proposalId)
    }

    await logAudit({
      action: 'UPDATE',
      entity: 'PROPOSAL',
      entityId: parsed.data.proposalId,
      userId: user.id,
      changes: { staffDecision: parsed.data.decision, staffNotes: parsed.data.staffNotes },
    })

    revalidatePath('/rules/decisions')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to confirm proposal', error, {
      proposalId: parsed.data.proposalId,
    })
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
}

// =============================================================================
// CONFLICT RESOLUTION
// =============================================================================

export async function advanceResolutionStage(input: AdvanceStageInput): Promise<ActionResult> {
  const user = await requireStaffAuth()
  const parsed = advanceStageSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    const [moved] = await db
      .update(incident)
      .set({
        resolutionStage: parsed.data.stage,
        stageEnteredAt: new Date(),
        ...(parsed.data.stage === 'CLOSED' ? { resolvedAt: new Date() } : {}),
      })
      .where(eq(incident.id, parsed.data.incidentId))
      .returning({ id: incident.id })
    // Prisma threw on a missing incident; keep that outcome for a bad id.
    if (!moved) return { success: false, error: ERROR_MESSAGES.RESOLUTION_STAGE_ERROR }

    // The stage change itself is the follow-up record — the incident history
    // must show why it moved, not just that it did.
    if (parsed.data.note) {
      await db.insert(incidentFollowUp).values({
        incidentId: parsed.data.incidentId,
        action: `Schritt gewechselt: ${parsed.data.stage}`,
        notes: parsed.data.note,
        staffName: user.name,
      })
    }

    await logAudit({
      action: 'UPDATE',
      entity: 'INCIDENT',
      entityId: parsed.data.incidentId,
      userId: user.id,
      changes: { resolutionStage: parsed.data.stage },
    })

    revalidatePath(`/incidents/${parsed.data.incidentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to advance resolution stage', error, {
      incidentId: parsed.data.incidentId,
    })
    return { success: false, error: ERROR_MESSAGES.RESOLUTION_STAGE_ERROR }
  }
}

export async function createAgreement(
  input: CreateAgreementInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireStaffAuth()
  const parsed = createAgreementSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    // Agreement and its parties land together or not at all — the nested
    // create Prisma did in one call becomes two inserts in one transaction.
    const agreement = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(conflictAgreement)
        .values({
          incidentId: parsed.data.incidentId,
          terms: parsed.data.terms,
          reviewDate: parsed.data.reviewDate,
          mediatorName: parsed.data.mediatorName ?? user.name,
          status: 'PROPOSED',
        })
        .returning()
      if (parsed.data.residentIds.length > 0) {
        await tx
          .insert(agreementParty)
          .values(
            parsed.data.residentIds.map((residentId) => ({ agreementId: created.id, residentId })),
          )
      }
      return created
    })

    await logAudit({
      action: 'CREATE',
      entity: 'CONFLICT_AGREEMENT',
      entityId: agreement.id,
      userId: user.id,
      changes: { incidentId: parsed.data.incidentId, parties: parsed.data.residentIds.length },
    })

    revalidatePath(`/incidents/${parsed.data.incidentId}`)
    return { success: true, data: { id: agreement.id } }
  } catch (error) {
    logger.errorWithCause('Failed to create agreement', error, {
      incidentId: parsed.data.incidentId,
    })
    return { success: false, error: ERROR_MESSAGES.AGREEMENT_SAVE_ERROR }
  }
}

/**
 * Record whether an agreement held. This is the measurement the whole ladder
 * rests on — without it "resolved" is just a note someone typed.
 */
export async function reviewAgreement(input: ReviewAgreementInput): Promise<ActionResult> {
  const user = await requireStaffAuth()
  const parsed = reviewAgreementSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT,
    }
  }

  try {
    const [agreement] = await db
      .update(conflictAgreement)
      .set({
        status: parsed.data.status,
        outcomeNotes: parsed.data.outcomeNotes,
        reviewedAt: new Date(),
      })
      .where(eq(conflictAgreement.id, parsed.data.agreementId))
      .returning({ id: conflictAgreement.id, incidentId: conflictAgreement.incidentId })
    // Prisma threw on a missing agreement; keep that outcome for a bad id.
    if (!agreement) return { success: false, error: ERROR_MESSAGES.AGREEMENT_SAVE_ERROR }

    await logAudit({
      action: 'UPDATE',
      entity: 'CONFLICT_AGREEMENT',
      entityId: agreement.id,
      userId: user.id,
      changes: { status: parsed.data.status },
    })

    revalidatePath(`/incidents/${agreement.incidentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to review agreement', error, {
      agreementId: parsed.data.agreementId,
    })
    return { success: false, error: ERROR_MESSAGES.AGREEMENT_SAVE_ERROR }
  }
}

/** Default review date for a new agreement — short enough that it still matters. */
export async function defaultAgreementReviewDate(): Promise<Date> {
  const date = new Date()
  date.setDate(date.getDate() + AGREEMENT_CONFIG.defaultReviewDays)
  return date
}
