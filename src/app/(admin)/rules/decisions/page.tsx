import { PageHeader, PageShell } from '@/components/ui/Page'
import { Card } from '@/components/ui'
import { requireStaffAuth } from '@/lib/auth'
import { getProposalsAwaitingStaff } from '@/lib/governance/queries'
import { tallyVotes } from '@/lib/governance/voting'
import { ConfirmProposalForm } from './ConfirmProposalForm'
import {
  DECISION_MODE_LABELS,
  PROPOSAL_TYPE_LABELS,
  VOTE_CHOICE_LABELS,
} from '@/lib/config/decisions'
import { RULE_CATEGORY_LABELS } from '@/lib/config/house-rules'

export const dynamic = 'force-dynamic'

export default async function DecisionsPage() {
  await requireStaffAuth()

  const proposals = await getProposalsAwaitingStaff()

  return (
    <PageShell>
      <PageHeader
        title="Beschlüsse bestätigen"
        description="Hausbeschlüsse, die noch eine Bestätigung brauchen — weil sie ein AOZ-Thema betreffen, oder weil im Haus nicht abgestimmt werden konnte."
        backHref="/rules"
        backLabel="Regeln"
      />

      {proposals.length === 0 ? (
        <Card>
          <p className="text-sm text-ui-muted">Nichts offen. Alle Beschlüsse sind bearbeitet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const tally = tallyVotes({
              votes: proposal.votes,
              eligibleVoterCount: proposal.eligibleVoterCount,
              threshold: proposal.threshold,
              quorumPercent: proposal.quorumPercent,
              approvalPercent: proposal.approvalPercent,
            })

            const vetoes = proposal.votes.filter((v) => v.choice === 'BLOCK')

            return (
              <Card key={proposal.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-normal text-ui-muted">
                      {proposal.housingUnit.code} · {PROPOSAL_TYPE_LABELS[proposal.type]} ·{' '}
                      {RULE_CATEGORY_LABELS[proposal.category]}
                    </p>
                    <h2 className="mt-1 font-semibold text-ui-text">{proposal.title}</h2>
                  </div>
                  <span className="badge shrink-0 bg-status-warning/15 text-status-warning-text">
                    {DECISION_MODE_LABELS[proposal.decisionMode]}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ui-muted">
                  {proposal.body}
                </p>

                {proposal.parentOrgRule && (
                  <p className="mt-3 text-sm text-ui-muted">
                    Gehört zur AOZ-Regel:{' '}
                    <span className="font-medium text-ui-text">{proposal.parentOrgRule.title}</span>
                  </p>
                )}

                {/* The tally in plain language — the same sentence residents see,
                    so staff and house never hold different accounts of the vote. */}
                <p className="mt-3 rounded-md bg-ui-subtle p-3 text-sm text-ui-text">
                  {proposal.outcomeSummary ?? tally.explanation}
                </p>

                {vetoes.length > 0 && (
                  <div className="mt-3 rounded-md border border-status-warning/40 p-3">
                    <p className="text-sm font-medium text-status-warning-text">
                      {vetoes.length}× {VOTE_CHOICE_LABELS.BLOCK} — bitte vor der Bestätigung lesen
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-ui-muted">
                      {vetoes.map((veto) => (
                        <li key={veto.id}>&bdquo;{veto.reason}&ldquo;</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proposal.category === 'NOISE' && (
                  // The unit's quietHours field feeds the matching algorithm and
                  // is not derived from rule text, so it needs a human to keep
                  // the two in step at exactly this moment.
                  <p className="mt-3 text-sm text-status-info-text">
                    Hinweis: Wenn dieser Beschluss die Ruhezeiten ändert, bitte auch das Feld
                    «Ruhezeiten» bei der Unterkunft anpassen — es wird fürs Matching verwendet.
                  </p>
                )}

                <ConfirmProposalForm proposalId={proposal.id} />
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
