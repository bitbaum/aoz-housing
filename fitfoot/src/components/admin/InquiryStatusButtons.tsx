'use client'

import { useTransition } from 'react'
import { INQUIRY_STATUSES } from '@/config/database'
import { updateInquiryStatusAction } from '@/lib/actions/crm'
import { INQUIRY_STATUS_LABELS as LABELS } from '@/config/labels'

export function InquiryStatusButtons({
  inquiryId,
  current,
}: {
  inquiryId: string
  current: string
}) {
  const [pending, startTransition] = useTransition()

  function setStatus(status: string) {
    startTransition(async () => {
      await updateInquiryStatusAction(inquiryId, status)
    })
  }

  return (
    <div className="flex gap-1">
      {INQUIRY_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending || status === current}
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
