import { PageHeader, PageShell } from '@/components/ui/Page'
import { Card, StatCard } from '@/components/ui'
import { RuleBookView } from '@/components/governance/RuleBookView'
import { SyncCatalogButton } from './SyncCatalogButton'
import { getOrgRules, getProposalsAwaitingStaff } from '@/lib/governance/queries'
import { buildRuleBook } from '@/lib/governance/rules'
import { requireStaffAuth } from '@/lib/auth'
import Link from 'next/link'
import {
  DELEGATION_ALLOWS_UNIT_RULE,
  RULE_DELEGATION_LABELS,
} from '@/lib/config/house-rules'
import { BRAND } from '@/lib/config/brand'

export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  await requireStaffAuth()

  const [orgRules, awaitingStaff] = await Promise.all([
    getOrgRules(),
    getProposalsAwaitingStaff(),
  ])

  const activeOrgRules = orgRules.filter((r) => r.status === 'ACTIVE')
  // An AOZ rule is only a floor if it leaves something for the house to decide;
  // this counts how much room the catalog actually delegates.
  const delegatedCount = activeOrgRules.filter(
    (r) => DELEGATION_ALLOWS_UNIT_RULE[r.delegation]
  ).length

  const ruleBook = buildRuleBook(orgRules, [])

  return (
    <PageShell>
      <PageHeader
        title="Regeln"
        description={`${BRAND.orgName}-Regeln gelten überall. Wo sie es zulassen, beschliesst jedes Haus seine eigenen Hausregeln.`}
        actions={<SyncCatalogButton />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`${BRAND.orgName}-Regeln`} value={activeOrgRules.length} />
        <StatCard
          label="Davon vom Haus gestaltbar"
          value={delegatedCount}
          subtitle={`${activeOrgRules.length - delegatedCount} nicht verhandelbar`}
        />
        <StatCard
          label="Warten auf Bestätigung"
          value={awaitingStaff.length}
          href="/rules/decisions"
          trend={awaitingStaff.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <Card>
        <h2 className="mb-2 font-semibold text-ui-text">Wie die zwei Ebenen zusammenspielen</h2>
        <dl className="space-y-2 text-sm text-ui-muted">
          {(['FIXED', 'UNIT_MAY_STRENGTHEN', 'UNIT_DECIDES'] as const).map((delegation) => (
            <div key={delegation} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-48 shrink-0 font-medium text-ui-text">
                {RULE_DELEGATION_LABELS[delegation]}
              </dt>
              <dd>{DELEGATION_EXPLANATIONS[delegation]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-ui-muted">
          Hausregeln stehen bei der jeweiligen Unterkunft unter{' '}
          <Link href="/housing" className="text-brand-primary underline">
            Unterkünfte
          </Link>
          .
        </p>
      </Card>

      <RuleBookView ruleBook={ruleBook} />
    </PageShell>
  )
}

const DELEGATION_EXPLANATIONS: Record<string, string> = {
  FIXED: 'Gilt unverändert in allen Häusern. Kein Hausbeschluss kann sie lockern oder ersetzen.',
  UNIT_MAY_STRENGTHEN:
    `Die ${BRAND.orgName}-Regel ist das Minimum. Ein Haus kann strenger werden — die Betreuung bestätigt, dass der Beschluss die ${BRAND.orgName}-Regel nicht unterläuft.`,
  UNIT_DECIDES:
    `Die ${BRAND.orgName} gibt nur das Thema vor. Wie es im Haus gilt, beschliessen die Bewohnenden selbst.`,
}
