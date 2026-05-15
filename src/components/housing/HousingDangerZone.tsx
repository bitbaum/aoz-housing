'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { hardDeleteHousingUnitProtected } from '@/lib/actions'
import { HOUSING_DANGER_ZONE_LABELS } from '@/lib/constants/labels'

interface Props {
  housingUnitId: string
  code: string
}

const HOUSING_BLOCKER_LABELS: Record<string, string> = {
  placements: 'Platzierungen',
  incidents: 'Vorfälle',
  maintenanceRequests: 'Wartungsmeldungen',
  spots: 'Spots',
  tasks: 'Aufgaben',
}

export function HousingDangerZone({ housingUnitId, code }: Props) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [blockerReport, setBlockerReport] = useState<Record<string, number> | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEligibleCode = /test|demo/i.test(code)

  const blockerText = useMemo(() => {
    if (!blockerReport) return ''
    return Object.entries(blockerReport)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${HOUSING_BLOCKER_LABELS[key] || key}: ${count}`)
      .join(', ')
  }, [blockerReport])

  return (
    <section className="mt-8 p-4 sm:p-5 border-2 border-red-300 rounded-lg bg-red-50" aria-labelledby="housing-danger-zone-title">
      <h2 id="housing-danger-zone-title" className="text-base sm:text-lg font-semibold text-red-900">Danger Zone — Hard-Delete</h2>
      <p className="text-sm text-red-800 mt-1 leading-relaxed">
        {HOUSING_DANGER_ZONE_LABELS.description}
      </p>

      {!isEligibleCode && (
        <p className="mt-3 text-sm text-red-700">
          {HOUSING_DANGER_ZONE_LABELS.notEligible}
        </p>
      )}

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 p-3 rounded text-sm ${feedback.kind === 'error' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-green-300'}`}
        >
          {feedback.text}
        </div>
      )}

      {blockerReport && (
        <div className="mt-3 p-3 rounded text-sm bg-amber-50 text-amber-900 border border-amber-300">
          <p><strong>{HOUSING_DANGER_ZONE_LABELS.blockerReportTitle}</strong> {blockerText || HOUSING_DANGER_ZONE_LABELS.noDetails}</p>
          <button
            type="button"
            className="mt-2 text-xs underline min-h-[44px] px-2 rounded hover:bg-amber-100"
            onClick={async () => {
              const ts = new Date().toISOString()
              await navigator.clipboard.writeText(`Delete Blocker Report | Type: HousingUnit | Code: ${code} | Timestamp: ${ts} | Details: ${blockerText}`)
              setFeedback({ kind: 'success', text: HOUSING_DANGER_ZONE_LABELS.copiedToClipboard })
            }}
          >
            {HOUSING_DANGER_ZONE_LABELS.reportCopyBtn}
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={HOUSING_DANGER_ZONE_LABELS.confirmPlaceholder}
          className="input min-h-[44px]"
          disabled={!isEligibleCode || isPending}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={HOUSING_DANGER_ZONE_LABELS.reasonPlaceholder}
          className="input min-h-[44px]"
          disabled={!isEligibleCode || isPending}
        />
      </div>

      <button
        type="button"
        className="mt-3 w-full sm:w-auto bg-red-600 text-white px-4 py-3 rounded-lg text-sm min-h-[44px] hover:bg-red-700 disabled:opacity-50"
        disabled={!isEligibleCode || isPending || confirmation !== 'DELETE' || reason.trim().length < 10}
        onClick={() => {
          setFeedback(null)
          setBlockerReport(null)
          startTransition(async () => {
            const result = await hardDeleteHousingUnitProtected(housingUnitId, confirmation, reason)
            if (!result.success) {
              setFeedback({ kind: 'error', text: result.error || HOUSING_DANGER_ZONE_LABELS.deleteFailed })
              setBlockerReport(result.blockerReport || null)
              return
            }
            setFeedback({ kind: 'success', text: HOUSING_DANGER_ZONE_LABELS.deleteSuccess })
            router.push('/housing?view=all')
            router.refresh()
          })
        }}
      >
        {HOUSING_DANGER_ZONE_LABELS.deleteBtn}
      </button>
    </section>
  )
}
