'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveTransferRequest, denyTransferRequest } from '@/lib/actions/transfers'
import { TRANSFER_ACTION_LABELS as L } from '@/lib/constants'

interface TransferActionsProps {
  requestId: string
}

export function TransferActions({ requestId }: TransferActionsProps) {
  const router = useRouter()
  const [staffNotes, setStaffNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

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
      <p role="status" className="text-sm text-status-success-text font-medium">{L.success}</p>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <textarea
        value={staffNotes}
        onChange={(e) => setStaffNotes(e.target.value)}
        placeholder={L.notesPlaceholder}
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-aoz-primary focus:ring-1 focus:ring-aoz-primary resize-none"
      />

      {result?.error && (
        <p role="alert" className="text-sm text-status-error-text">{result.error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading}
          className="btn-primary min-h-[44px] px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? L.processing : L.approve}
        </button>
        <button
          onClick={() => handleAction('deny')}
          disabled={loading}
          className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? L.processing : L.deny}
        </button>
      </div>
    </div>
  )
}
