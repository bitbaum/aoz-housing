import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireResidentCookie } from '@/lib/portal-auth'
import { getRuleBook, getUnitProposals, getUnitResidentIds } from '@/lib/governance/queries'
import { advanceDueProposals } from '@/lib/governance/lifecycle'
import { openTopics } from '@/lib/governance/rules'
import { canHoldVote, tallyVotes } from '@/lib/governance/voting'
import { ProposalList } from '@/components/governance/ProposalList'
import { NewProposalForm } from '@/components/governance/NewProposalForm'
import { PORTAL_LABELS } from '@/lib/constants/labels/portal'
import { DECISION_TIMING } from '@/lib/config/decisions'

export const metadata: Metadata = { title: 'Beschlüsse' }
export const dynamic = 'force-dynamic'

export default async function PortalDecisionsPage() {
  const residentCode = await requireResidentCookie('/portal')

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: { placements: { where: { status: 'ACTIVE' }, take: 1 } },
  })

  if (!resident) redirect('/portal')

  const placement = resident.placements[0]
  if (!placement) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-bold text-ui-text sm:text-2xl">
          {PORTAL_LABELS.pages.decisions}
        </h1>
        <p className="text-ui-muted">
          Sobald du einer Unterkunft zugeteilt bist, kannst du hier mitentscheiden.
        </p>
      </div>
    )
  }

  const unitId = placement.housingUnitId

  // Close anything overdue before rendering, so nobody is shown a vote that
  // actually ended days ago.
  await advanceDueProposals(new Date(), unitId)

  const [proposals, ruleBook, residentIds] = await Promise.all([
    getUnitProposals(unitId),
    getRuleBook(unitId),
    getUnitResidentIds(unitId),
  ])

  const votingPossible = canHoldVote(residentIds.length)

  const decorated = proposals.map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    body: proposal.body,
    type: proposal.type,
    category: proposal.category,
    status: proposal.status,
    decisionMode: proposal.decisionMode,
    threshold: proposal.threshold,
    votingEndsAt: proposal.votingEndsAt?.toISOString() ?? null,
    discussionEndsAt: proposal.discussionEndsAt?.toISOString() ?? null,
    outcomeSummary: proposal.outcomeSummary,
    staffNotes: proposal.staffNotes,
    parentRuleTitle: proposal.parentOrgRule?.title ?? null,
    isMine: proposal.proposedByResidentId === resident.id,
    myVote: proposal.votes.find((v) => v.residentId === resident.id)?.choice ?? null,
    tally: tallyVotes({
      votes: proposal.votes,
      eligibleVoterCount: proposal.eligibleVoterCount,
      threshold: proposal.threshold,
      quorumPercent: proposal.quorumPercent,
      approvalPercent: proposal.approvalPercent,
    }),
  }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-ui-text sm:text-2xl">
          {PORTAL_LABELS.pages.decisions}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ui-muted">
          Bei vielen Themen entscheidet ihr im Haus selbst. Ein Vorschlag wird zuerst{' '}
          {DECISION_TIMING.discussionDays} Tage besprochen, danach kann {DECISION_TIMING.votingDays}{' '}
          Tage lang abgestimmt werden.
        </p>
      </header>

      {!votingPossible && (
        <p className="rounded-md bg-ui-subtle p-3 text-sm text-ui-muted">
          In diesem Haus wohnen zurzeit zu wenige Personen für eine Abstimmung. Vorschläge kannst du
          trotzdem einreichen — die Betreuung bespricht sie mit euch.
        </p>
      )}

      <NewProposalForm
        openTopics={openTopics(ruleBook).map((entry) => ({
          id: entry.orgRule.id,
          title: entry.orgRule.title,
          category: entry.orgRule.category,
          delegation: entry.orgRule.delegation,
        }))}
        existingHouseRules={ruleBook.sections
          .flatMap((s) => s.entries.flatMap((e) => e.unitRules))
          .map((rule) => ({ id: rule.id, title: rule.title, category: rule.category }))}
      />

      <ProposalList proposals={decorated} />
    </div>
  )
}
