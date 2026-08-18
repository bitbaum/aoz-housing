import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth'
import { listLearningQueue } from '@/lib/actions/learning'
import { PageHeader } from '@/components/ui/Page'
import {
  LEARNING_KIND_LABELS,
  LEARNING_KINDS,
  LEARNING_LABELS,
  LEARNING_STATUS_LABELS,
  type LearningKindId,
  type LearningStatusId,
} from '@/lib/config/learning'
import { residentName } from '@/lib/utils/resident-name'
import { formatRelativeDate } from '@/lib/utils'
import type { LearningKind } from '@prisma/client'

export const metadata: Metadata = { title: 'Lernen' }
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ kind?: string }>
}

export default async function LearningQueuePage({ searchParams }: Props) {
  await requirePermission('learning:read')
  const { kind: rawKind } = await searchParams
  const kind =
    rawKind && (LEARNING_KINDS as readonly string[]).includes(rawKind)
      ? (rawKind as LearningKind)
      : undefined
  const { records, missingGerman } = await listLearningQueue(kind)

  return (
    <div className="space-y-8">
      <PageHeader
        title={kind ? LEARNING_KIND_LABELS[kind as LearningKindId] : LEARNING_LABELS.title}
        description={LEARNING_LABELS.subtitle}
      />

      {!kind && (
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
                    <p className="text-xs text-ui-muted">
                      {/* resident-code-intentional — staff queue, they look people up by login code */}
                      <span className="font-mono">{resident.code}</span>
                      {' · '}
                      {formatRelativeDate(resident.createdAt)}
                    </p>
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
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {LEARNING_LABELS.planned} / {LEARNING_LABELS.inProgress}
        </h2>
        {records.length === 0 ? (
          <p className="text-sm text-ui-muted">{LEARNING_LABELS.empty}</p>
        ) : (
          <ul className="divide-y divide-ui-border">
            {[...records]
              // IN_PROGRESS records need a follow-up more than PLANNED ones
              // do, and the one nobody has touched in the longest time needs
              // it most — the query's own `updatedAt desc` order buried
              // exactly that record at the bottom.
              .sort((a, b) => {
                const priority = (r: typeof a) => (r.status === 'IN_PROGRESS' ? 1 : 0)
                const diff = priority(b) - priority(a)
                if (diff !== 0) return diff
                return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
              })
              .map((record) => (
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
