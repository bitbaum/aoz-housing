import Link from 'next/link'
import type { LearningRecord } from '@prisma/client'
import {
  LEARNING_CATEGORY_LABELS,
  LEARNING_KIND_LABELS,
  LEARNING_LABELS,
  LEARNING_STATUS_LABELS,
  type LearningCategoryId,
  type LearningKindId,
  type LearningStatusId,
} from '@/lib/config/learning'
import { LearningForm } from './LearningForm'
import { createLearningRecordForResident } from '@/lib/actions/learning'
import { formatDate } from '@/lib/utils'

interface Props {
  residentId: string
  records: LearningRecord[]
  canWrite: boolean
}

export function LearningRecordsCard({ residentId, records, canWrite }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{LEARNING_LABELS.boardTitle}</h2>
        <Link
          href="/learning"
          className="text-sm text-brand-primary hover:underline min-h-[44px] inline-flex items-center"
        >
          {LEARNING_LABELS.subtitle.split('—')[0]}
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-ui-muted mb-4">{LEARNING_LABELS.empty}</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {records.map((record) => (
            <li key={record.id} className="border border-ui-border rounded-lg p-3">
              <p className="font-medium text-ui-text">{record.title}</p>
              <p className="text-sm text-ui-muted">
                {LEARNING_KIND_LABELS[record.kind as LearningKindId]}
                {record.cefrLevel ? ` · ${record.languageCode || ''} ${record.cefrLevel}` : ''}
                {record.category
                  ? ` · ${LEARNING_CATEGORY_LABELS[record.category as LearningCategoryId] || record.category}`
                  : ''}
                {' · '}
                {LEARNING_STATUS_LABELS[record.status as LearningStatusId]}
              </p>
              {record.completedAt && (
                <p className="text-xs text-ui-muted mt-1">
                  {LEARNING_LABELS.completedAt}: {formatDate(record.completedAt)}
                </p>
              )}
              {record.hours != null && (
                <p className="text-xs text-ui-muted mt-1">
                  {LEARNING_LABELS.hours}: {record.hours}
                </p>
              )}
              <p className="text-xs text-ui-muted mt-1">
                {record.recordedBy === 'RESIDENT'
                  ? LEARNING_LABELS.recordedByResident
                  : LEARNING_LABELS.recordedByStaff}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <details className="group">
          <summary className="min-h-[44px] cursor-pointer text-sm font-medium text-brand-primary list-none">
            {LEARNING_LABELS.add}
          </summary>
          <div className="mt-4">
            <LearningForm
              action={createLearningRecordForResident}
              residentId={residentId}
              audience="staff"
            />
          </div>
        </details>
      )}
    </div>
  )
}
