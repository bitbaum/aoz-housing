/**
 * A unit's rule book as staff see it, with one number that matters more than
 * the rules themselves: how much of it the residents have actually read.
 *
 * Acknowledgement coverage is the leading indicator for norm conflicts —
 * incidents are the lagging one. A house running at 60% coverage is a house
 * where some people are being held to rules nobody showed them.
 */

import Link from 'next/link'
import { RuleBookView } from './RuleBookView'
import { openTopics, type RuleBook } from '@/lib/governance/rules'
import type { UnitAcknowledgementCoverage } from '@/lib/governance/acknowledgement'
import { BRAND } from '@/lib/config/brand'

interface UnitRulesSectionProps {
  ruleBook: RuleBook
  coverage: UnitAcknowledgementCoverage
  unitCode: string
}

export function UnitRulesSection({ ruleBook, coverage, unitCode }: UnitRulesSectionProps) {
  const open = openTopics(ruleBook)

  return (
    <section className="card" aria-labelledby="unit-rules-heading">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="unit-rules-heading" className="text-lg font-semibold text-ui-text">
            Regeln in {unitCode}
          </h2>
          <p className="mt-1 text-sm text-ui-muted">
            {ruleBook.totalUnitRules === 1 ? '1 eigene Hausregel' : `${ruleBook.totalUnitRules} eigene Hausregeln`}
            {' · '}
            {open.length === 1 ? '1 Thema noch offen' : `${open.length} Themen noch offen`}
          </p>
        </div>
        <Link href="/rules" className="text-sm text-brand-primary hover:underline">
          {BRAND.orgName}-Regeln ansehen
        </Link>
      </div>

      <div
        className={`mb-4 rounded-md p-3 text-sm ${
          coverage.needsAttention
            ? 'bg-status-warning/10 text-status-warning-text'
            : 'bg-status-success/10 text-status-success-text'
        }`}
      >
        <p className="font-medium">
          Regelkenntnis: {coverage.coveragePercent}% bestätigt
        </p>
        <p className="mt-1 leading-6">
          {coverage.residentsWithGaps.length === 0
            ? 'Alle Bewohnenden haben alle Regeln gelesen und bestätigt.'
            : `${coverage.residentsWithGaps.length} von ${coverage.totalResidents} Bewohnenden haben Regeln noch nicht bestätigt. Die häufigste Ursache von Konflikten ist eine Regel, die jemand nie gesehen hat.`}
        </p>
      </div>

      <RuleBookView ruleBook={ruleBook} />
    </section>
  )
}
