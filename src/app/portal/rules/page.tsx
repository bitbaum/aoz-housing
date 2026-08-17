import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireResidentCookie } from '@/lib/portal-auth'
import { getOutstandingRules, getRuleBook } from '@/lib/governance/queries'
import { AcknowledgeRulesPanel } from '@/components/governance/AcknowledgeRulesPanel'
import { RuleBookView } from '@/components/governance/RuleBookView'
import { BRAND } from '@/lib/config/brand'
import { ORG_ENFORCEMENT } from '@/lib/config/organization'
import { getRequestTranslator } from '@/lib/i18n/request'

export const metadata: Metadata = { title: 'Hausregeln' }
export const dynamic = 'force-dynamic'

export default async function PortalRulesPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

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
          {t('rules.title')}
        </h1>
        <p className="text-ui-muted">
          {t('rules.noPlacement')}
        </p>
      </div>
    )
  }

  const [ruleBook, outstanding] = await Promise.all([
    getRuleBook(placement.housingUnitId),
    getOutstandingRules(resident.id, placement.housingUnitId),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-ui-text sm:text-2xl">{t('rules.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-ui-muted">
          {t('rules.subtitle')}
        </p>
        {BRAND.features.householdVotes && (
        <Link
          href="/portal/decisions"
          className="mt-2 inline-flex min-h-[44px] items-center text-sm text-brand-primary hover:underline"
        >
          {t('rules.toDecisions')} →
        </Link>
        )}
      </header>

      {/* Placed first on purpose: an unread rule is the single most common cause
          of a "conflict" that is really just a norm nobody communicated. */}
      {outstanding.length > 0 && (
        <AcknowledgeRulesPanel
          rules={outstanding.map((o) => ({
            id: o.rule.id,
            title: o.rule.title,
            body: o.rule.body,
            isAmendment: o.isAmendment,
          }))}
        />
      )}

      <RuleBookView ruleBook={ruleBook} outstandingRuleIds={outstanding.map((o) => o.rule.id)} />

      {/* Consequences belong WITH the rule book: a sanction nobody was told
          about is not a consequence, it is a surprise. SSOT: config/organization.ts */}
      <section className="card">
        <h2 className="text-base font-semibold text-ui-text">{ORG_ENFORCEMENT.title}</h2>
        <div className="mt-3 space-y-3">
          {ORG_ENFORCEMENT.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-ui-muted">
              {paragraph}
            </p>
          ))}
        </div>
        <Link
          href="/portal/help"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand-primary hover:underline"
        >
          Kontakte und Notfall-Nummern →
        </Link>
      </section>
    </div>
  )
}
