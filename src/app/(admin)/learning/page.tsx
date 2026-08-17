import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth'
import { listLearningQueue } from '@/lib/actions/learning'
import { PageHeader } from '@/components/ui/Page'
import {
  LEARNING_KIND_LABELS,
  LEARNING_LABELS,
  LEARNING_STATUS_LABELS,
  type LearningKindId,
  type LearningStatusId,
} from '@/lib/config/learning'
import { residentName } from '@/lib/utils/resident-name'

export const metadata: Metadata = { title: 'Lernen' }
export const dynamic = 'force-dynamic'

export default async function LearningQueuePage() {
  await requirePermission('learning:read')
  const { records, missingGerman } = await listLearningQueue()

  return (
    <div className="space-y-8">
      <PageHeader title={LEARNING_LABELS.title} description={LEARNING_LABELS.subtitle} />

      <section className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-1">{LEARNING_LABELS.germanMissing}</h2>
        <p className="text-sm text-ui-muted mb-4">{LEARNING_LABELS.noGermanHint}</p>
        {missingGerman.length === 0 ? (
          <p className="text-sm text-ui-muted">{LEARNING_LABELS.empty}</p>
        ) : (
          <ul className="divide-y divide-ui-border">
            {missingGerman.map((resident) => (
              <li key={resident.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <Link href={`/residents/${resident.id}`} className="font-medium text-ui-text hover:underline">
                    {residentName(resident)}
                  </Link>
                  {/* resident-code-intentional — staff queue, they look people up by login code */}
                  <p className="text-xs text-ui-muted font-mono">{resident.code}</p>
                </div>
                <Link
                  href={`/residents/${resident.id}`}
                  className="btn-outline text-sm min-h-[44px] inline-flex items-center"
                >
                  {LEARNING_LABELS.add}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {LEARNING_LABELS.planned} / {LEARNING_LABELS.inProgress}
        </h2>
        {records.length === 0 ? (
          <p className="text-sm text-ui-muted">{LEARNING_LABELS.empty}</p>
        ) : (
          <ul className="divide-y divide-ui-border">
            {records.map((record) => (
              <li key={record.id} className="py-3">
                <Link href={`/residents/${record.resident.id}`} className="font-medium text-ui-text hover:underline">
                  {residentName(record.resident)}
                </Link>
                <p className="text-sm text-ui-muted">
                  {record.title} · {LEARNING_KIND_LABELS[record.kind as LearningKindId]}
                  {record.cefrLevel ? ` · ${record.languageCode || ''} ${record.cefrLevel}` : ''}
                  {' · '}
                  {LEARNING_STATUS_LABELS[record.status as LearningStatusId]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
