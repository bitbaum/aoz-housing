import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db, resident as residentTable, placement as placementTable } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireResidentCookie } from '@/lib/portal-auth'
import { getRuleBook, getUnitProposals, getUnitResidentIds } from '@/lib/governance/queries'
import { advanceDueProposals } from '@/lib/governance/lifecycle'
import { openTopics } from '@/lib/governance/rules'
import { canHoldVote, tallyVotes } from '@/lib/governance/voting'
import { PageHeader, PageShell } from '@/components/ui/Page'
import { ProposalList } from '@/components/governance/ProposalList'
import { NewProposalForm } from '@/components/governance/NewProposalForm'
import { DECISION_TIMING } from '@/lib/config/decisions'
import { getRequestTranslator } from '@/lib/i18n/request'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.decisions') }
}
export const dynamic = 'force-dynamic'

export default async function PortalDecisionsPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: { placements: { where: eq(placementTable.status, 'ACTIVE'), limit: 1 } },
  })

  if (!resident) redirect('/portal')

  const placement = resident.placements[0]
  if (!placement) {
    return (
      <PageShell>
        <PageHeader title={t('decisions.title')} description={t('decisions.noPlacement')} />
      </PageShell>
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
    <PageShell>
      <PageHeader title={t('decisions.title')} description={t('decisions.subtitle')} />

      {/* The two windows as DATA rather than as a sentence with numbers baked
          into it. The translator has no interpolation, so the old prose could
          not be translated at all and stayed German on every locale — a
          resident reading the portal in Ukrainian was told, in German, how
          long they had to vote. Rendering the figures beside their labels also
          matches how every other number in this product is shown. */}
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ui-muted">
        <div className="flex items-center gap-2">
          <dt className="eyebrow">{t('decisions.phaseDiscussion')}</dt>
          <dd className="numeric text-ui-text">
            {DECISION_TIMING.discussionDays} {t('decisions.days')}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="eyebrow">{t('decisions.phaseVoting')}</dt>
          <dd className="numeric text-ui-text">
            {DECISION_TIMING.votingDays} {t('decisions.days')}
          </dd>
        </div>
      </dl>

      {!votingPossible && (
        <p className="rounded-md bg-ui-subtle p-3 text-sm text-ui-muted">
          {t('decisions.tooFewVoters')}
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
    </PageShell>
  )
}
