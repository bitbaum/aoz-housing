'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INQUIRY_STATUSES } from '@/config/database'

const LABELS: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export function InquiryStatusButtons({
  inquiryId,
  current,
}: {
  inquiryId: string
  current: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(status: string) {
    setBusy(true)
    await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex gap-1">
      {INQUIRY_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          disabled={busy || status === current}
          onClick={() => setStatus(status)}
          className={`min-h-[44px] rounded border px-3 py-1 text-xs font-semibold transition-colors ${
            status === current
              ? 'border-gold-500 bg-gold-50 text-gold-700'
              : 'border-line text-muted hover:border-line-strong'
          }`}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  )
}
