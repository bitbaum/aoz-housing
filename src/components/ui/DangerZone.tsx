'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface DangerZoneLabels {
  title: string
  description: string
  notEligible: string
  blockerReportTitle: string
  noDetails: string
  copyReport: string
  copiedToClipboard: string
  confirmPlaceholder: string
  reasonPlaceholder: string
  deleteFailed: string
  deleteSuccess: string
  deleteButton: string
}

interface DangerZoneProps {
  entityId: string
  entityCode: string
  entityType: string
  labels: DangerZoneLabels
  blockerLabels: Record<string, string>
  onDelete: (
    id: string,
    confirmation: string,
    reason: string,
  ) => Promise<{ success: boolean; error?: string; blockerReport?: Record<string, number> }>
  redirectPath: string
  ariaId: string
}

export function DangerZone({
  entityId,
  entityCode,
  entityType,
  labels,
  blockerLabels,
  onDelete,
  redirectPath,
  ariaId,
}: DangerZoneProps) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [blockerReport, setBlockerReport] = useState<Record<string, number> | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEligibleCode = /test|demo/i.test(entityCode)

  const blockerText = useMemo(() => {
    if (!blockerReport) return ''
    return Object.entries(blockerReport)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${blockerLabels[key] || key}: ${count}`)
      .join(', ')
  }, [blockerReport, blockerLabels])

  return (
    <section
      className="mt-8 p-4 sm:p-5 border-2 border-status-error/30 rounded-lg bg-status-error/8"
      aria-labelledby={ariaId}
    >
      <h2 id={ariaId} className="text-base sm:text-lg font-semibold text-red-900">
        {labels.title}
      </h2>
      <p className="text-sm text-red-800 mt-1 leading-relaxed">
        {labels.description}
      </p>

      {!isEligibleCode && (
        <p className="mt-3 text-sm text-red-700">
          {labels.notEligible}
        </p>
      )}

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 p-3 rounded text-sm ${
            feedback.kind === 'error'
              ? 'bg-status-error/15 text-red-800 border border-status-error/30'
              : 'bg-status-success/15 text-green-800 border border-status-success/30'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {blockerReport && (
        <div className="mt-3 p-3 rounded text-sm bg-status-warning/10 text-amber-900 border border-status-warning/30">
          <p>
            <strong>{labels.blockerReportTitle}</strong>{' '}
            {blockerText || labels.noDetails}
          </p>
          <button
            type="button"
            className="mt-2 text-xs underline min-h-[44px] px-2 rounded hover:bg-status-warning/15"
            onClick={async () => {
              const ts = new Date().toISOString()
              await navigator.clipboard.writeText(
                `Delete Blocker Report | Type: ${entityType} | Code: ${entityCode} | Timestamp: ${ts} | Details: ${blockerText}`,
              )
              setFeedback({ kind: 'success', text: labels.copiedToClipboard })
            }}
          >
            {labels.copyReport}
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={labels.confirmPlaceholder}
          className="input min-h-[44px]"
          disabled={!isEligibleCode || isPending}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={labels.reasonPlaceholder}
          className="input min-h-[44px]"
          disabled={!isEligibleCode || isPending}
        />
      </div>

      <button
        type="button"
        className="mt-3 w-full sm:w-auto bg-status-error text-white px-4 py-3 rounded-lg text-sm min-h-[44px] hover:bg-status-error/90 disabled:opacity-50"
        disabled={!isEligibleCode || isPending || confirmation !== 'DELETE' || reason.trim().length < 10}
        onClick={() => {
          setFeedback(null)
          setBlockerReport(null)
          startTransition(async () => {
            const result = await onDelete(entityId, confirmation, reason)
            if (!result.success) {
              setFeedback({ kind: 'error', text: result.error || labels.deleteFailed })
              setBlockerReport(result.blockerReport || null)
              return
            }
            setFeedback({ kind: 'success', text: labels.deleteSuccess })
            router.push(redirectPath)
            router.refresh()
          })
        }}
      >
        {labels.deleteButton}
      </button>
    </section>
  )
}
