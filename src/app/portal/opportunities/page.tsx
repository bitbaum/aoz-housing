import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPortalResident } from '@/lib/portal-auth'
import { PageHeader, EmptyState } from '@/components/ui/Page'
import { getRequestTranslator } from '@/lib/i18n/request'
import {
  applicationStageLabel,
  opportunityKindLabel,
  permitRequirementLabel,
} from '@/lib/i18n/opportunity-labels'
import { residentOpportunityBoard } from '@/lib/data/opportunities'
import { expressInterest, withdrawInterest } from '@/lib/actions/opportunities'
import {
  APPLICATION_STAGE_BADGES,
  PERMIT_REQUIREMENT_BADGES,
  type ApplicationStageId,
  type OpportunityKindId,
  type PermitRequirementId,
} from '@/lib/config/opportunities'
import { formatDate } from '@/lib/utils/formatting'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.opportunities') }
}
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ ok?: string; error?: string }>
}

/** URL params the actions redirect back with, mapped to what the reader sees. */
const OK_KEYS = {
  interest: 'opportunities.okInterest',
  withdrawn: 'opportunities.okWithdrawn',
} as const

const ERROR_KEYS = {
  unavailable: 'opportunities.errorUnavailable',
  full: 'opportunities.errorFull',
  locked: 'opportunities.errorLocked',
  failed: 'opportunities.errorFailed',
} as const

export default async function PortalOpportunitiesPage({ searchParams }: Props) {
  const resident = await getPortalResident()
  if (!resident) redirect('/login')

  const [{ t }, { mine, open }, params] = await Promise.all([
    getRequestTranslator(),
    residentOpportunityBoard(resident.id),
    searchParams,
  ])

  const okKey =
    params.ok && params.ok in OK_KEYS ? OK_KEYS[params.ok as keyof typeof OK_KEYS] : null
  const errorKey =
    params.error && params.error in ERROR_KEYS
      ? ERROR_KEYS[params.error as keyof typeof ERROR_KEYS]
      : null

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={t('opportunities.title')}
          description={t('opportunities.subtitle')}
          backHref="/portal"
          backLabel={t('nav.overview')}
        />
      </div>

      {okKey ? (
        <p className="alert-success mb-6" role="status">
          {t(okKey)}
        </p>
      ) : null}
      {errorKey ? (
        <p className="alert-error mb-6" role="alert">
          {t(errorKey)}
        </p>
      ) : null}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ui-text mb-3">{t('opportunities.yours')}</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-ui-muted">{t('opportunities.yoursEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {mine.map((application) => {
              const stage = application.stage as ApplicationStageId
              // Offered only where the server will actually allow it: your own
              // interest, untouched. Anything further along is a conversation
              // that has started, and a button that quietly failed would be
              // worse than no button.
              const canWithdraw = application.createdBy === 'RESIDENT' && stage === 'INTERESTED'

              return (
                <li key={application.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-ui-text">{application.opportunity.title}</p>
                    <span className={APPLICATION_STAGE_BADGES[stage]}>
                      {applicationStageLabel(t, stage)}
                    </span>
                  </div>
                  <p className="text-sm text-ui-muted mt-1">
                    {application.opportunity.organisation}
                    {' · '}
                    {opportunityKindLabel(t, application.opportunity.kind as OpportunityKindId)}
                    {' · '}
                    {formatDate(application.stageChangedAt)}
                  </p>
                  {canWithdraw ? (
                    <form action={withdrawInterest} className="mt-3">
                      <input type="hidden" name="applicationId" value={application.id} />
                      <button type="submit" className="btn-ghost">
                        {t('opportunities.withdraw')}
                      </button>
                    </form>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-sm text-ui-muted mt-3">
          {t('opportunities.evidenceHint')}{' '}
          <Link
            href="/portal/learning"
            className="text-brand-primary hover:underline inline-flex min-h-[44px] items-center"
          >
            {t('opportunities.toLearning')}
          </Link>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ui-text mb-3">{t('opportunities.open')}</h2>
        {open.length === 0 ? (
          <EmptyState title={t('opportunities.openEmpty')} />
        ) : (
          <ul className="space-y-3">
            {open.map((opportunity) => {
              const permit = opportunity.permitRequirement as PermitRequirementId
              const full = opportunity.seatsLeft === 0

              return (
                <li key={opportunity.id} className="card">
                  <p className="eyebrow">
                    {opportunityKindLabel(t, opportunity.kind as OpportunityKindId)}
                  </p>
                  <p className="font-medium text-ui-text mt-1">{opportunity.title}</p>
                  <p className="text-sm text-ui-muted mt-1">
                    {opportunity.organisation}
                    {opportunity.location ? ` · ${opportunity.location}` : ''}
                  </p>
                  <p className="text-sm text-ui-text mt-2 leading-relaxed">
                    {opportunity.description}
                  </p>

                  <p className="mt-3">
                    <span className={PERMIT_REQUIREMENT_BADGES[permit]}>
                      {permitRequirementLabel(t, permit)}
                    </span>
                  </p>

                  <p className="text-xs text-ui-muted mt-2">
                    {[
                      opportunity.germanLevel
                        ? `${t('opportunities.germanLevel')} ${opportunity.germanLevel}`
                        : null,
                      opportunity.hoursPerWeek
                        ? `${opportunity.hoursPerWeek} ${t('opportunities.perWeek')}`
                        : null,
                      opportunity.schedule,
                      // null seats means the listing never stated a number, and
                      // that is not the same fact as "no seats left" — saying
                      // "0 frei" there would hide a place that is open.
                      opportunity.seatsLeft === null
                        ? null
                        : full
                          ? t('opportunities.seatsFull')
                          : `${t('opportunities.seatsFree')} ${opportunity.seatsLeft}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {full ? null : (
                    <form action={expressInterest} className="mt-3">
                      <input type="hidden" name="opportunityId" value={opportunity.id} />
                      {/* Neutral, not brand — this button repeats once per
                          listing, and brand red is rationed to the single
                          action that matters on a screen. */}
                      <button type="submit" className="btn-primary">
                        {t('opportunities.express')}
                      </button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
