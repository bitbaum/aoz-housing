import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'
import { LearningForm } from '@/components/residents/LearningForm'
import { createOwnLearningRecord } from '@/lib/actions/learning'
import { getRequestTranslator } from '@/lib/i18n/request'
import { listActivities } from '@/lib/data/activities'
import {
  LEARNING_KIND_LABELS,
  LEARNING_LABELS,
  LEARNING_STATUS_LABELS,
  isAchievementRecord,
  type LearningKindId,
  type LearningStatusId,
} from '@/lib/config/learning'
import { ACTIVITY_COST_LABELS } from '@/lib/config/activities'

export const metadata: Metadata = { title: 'Lernen' }
export const dynamic = 'force-dynamic'

export default async function PortalLearningPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()
  const [resident, languageOffers] = await Promise.all([
    prisma.resident.findUnique({
      where: { code: residentCode },
      include: { learningRecords: { orderBy: { updatedAt: 'desc' } } },
    }),
    listActivities({
      publishedOnly: true,
      category: 'LANGUAGE',
      activeOn: new Date(),
      take: 8,
    }),
  ])
  if (!resident) redirect('/portal')

  const achievements = resident.learningRecords.filter(isAchievementRecord)
  const inProgress = resident.learningRecords.filter((record) => record.status === 'IN_PROGRESS')

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={t('learning.title')}
          description={t('learning.subtitle')}
          backHref="/portal"
          backLabel={t('nav.overview')}
        />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ui-text mb-3">{t('learning.achievements')}</h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-ui-muted">{t('learning.achievementsEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {achievements.map((record) => (
              <li key={record.id} className="card">
                <p className="font-medium text-ui-text">{record.title}</p>
                <p className="text-sm text-ui-muted">
                  {LEARNING_KIND_LABELS[record.kind as LearningKindId]}
                  {record.cefrLevel ? ` · ${record.languageCode || ''} ${record.cefrLevel}` : ''}
                  {record.hours != null ? ` · ${record.hours} ${t('learning.hours')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-ui-text mb-3">{t('learning.inProgress')}</h2>
          <ul className="space-y-3">
            {inProgress.map((record) => (
              <li key={record.id} className="card">
                <p className="font-medium text-ui-text">{record.title}</p>
                <p className="text-sm text-ui-muted">
                  {LEARNING_KIND_LABELS[record.kind as LearningKindId]}
                  {' · '}
                  {LEARNING_STATUS_LABELS[record.status as LearningStatusId]}
                  {record.hours != null ? ` · ${record.hours} ${t('learning.hours')}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-ui-text">{t('learning.offers')}</h2>
          <Link href="/portal/activities" className="text-sm text-brand-primary hover:underline min-h-[44px] inline-flex items-center">
            {t('nav.activities')}
          </Link>
        </div>
        {languageOffers.length === 0 ? (
          <p className="text-sm text-ui-muted">{t('learning.offersEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {languageOffers.map((offer) => (
              <li key={offer.id} className="card">
                <p className="font-medium text-ui-text">{offer.title}</p>
                <p className="text-sm text-ui-muted mt-1">{offer.description}</p>
                <p className="text-xs text-ui-muted mt-2">
                  {ACTIVITY_COST_LABELS[offer.cost]}
                  {offer.schedule ? ` · ${offer.schedule}` : ''}
                  {offer.location ? ` · ${offer.location}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{LEARNING_LABELS.add}</h2>
        <LearningForm action={createOwnLearningRecord} />
      </div>
    </div>
  )
}
