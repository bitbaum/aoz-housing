'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { approveTransferRequest, denyTransferRequest, type ReviewTransferResult } from '@/lib/actions/transfers'
import { TRANSFER_ACTION_LABELS as L } from '@/lib/constants'

interface TransferActionsProps {
  requestId: string
  residentId: string
  /** Whether the request names a target unit (approval then executes the move) */
  hasTargetUnit: boolean
}

export function TransferActions({ requestId, residentId, hasTargetUnit }: TransferActionsProps) {
  const router = useRouter()
  const [staffNotes, setStaffNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewTransferResult | null>(null)

  async function handleAction(action: 'approve' | 'deny') {
    setLoading(true)
    setResult(null)

    const fn = action === 'approve' ? approveTransferRequest : denyTransferRequest
    const res = await fn({ requestId, staffNotes: staffNotes || undefined })

    setResult(res)
    setLoading(false)
    if (res.success) {
      router.refresh()
    }
  }

  if (result?.success) {
    return (
      <div role="status" className="space-y-2">
        <p className="text-sm text-status-success-text font-medium">
          {result.executed ? L.successExecuted : L.success}
        </p>
        {!result.executed && (
          <p className="text-sm text-ui-muted">
            {L.completeTransferHint}{' '}
            <Link href={`/residents/${residentId}`} className="text-aoz-primary underline font-medium">
              {L.completeTransferLink}
            </Link>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-ui-border">
      <textarea
        value={staffNotes}
        onChange={(e) => setStaffNotes(e.target.value)}
        placeholder={L.notesPlaceholder}
        aria-label={L.notesPlaceholder}
        rows={2}
        className="input resize-none"
      />

      {result?.error && (
        <p role="alert" className="text-sm text-status-error-text">{result.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? L.processing : hasTargetUnit ? L.approveAndTransfer : L.approve}
        </button>
        <button
          onClick={() => handleAction('deny')}
          disabled={loading}
          className="btn-outline text-sm disabled:opacity-50"
        >
          {loading ? L.processing : L.deny}
        </button>
      </div>
    </div>
  )
}
