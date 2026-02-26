'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { hardDeleteResidentProtected } from '@/lib/actions'
import { DANGER_ZONE_LABELS } from '@/lib/constants'

interface Props {
  residentId: string
  residentCode: string
}

const RESIDENT_BLOCKER_LABELS: Record<string, string> = {
  placements: DANGER_ZONE_LABELS.blockers.placements,
  incidentsReported: DANGER_ZONE_LABELS.blockers.incidentsReported,
  incidentsAsSubject: DANGER_ZONE_LABELS.blockers.incidentsSubject,
  involvements: DANGER_ZONE_LABELS.blockers.incidentInvolvements,
  maintenanceRequests: DANGER_ZONE_LABELS.blockers.maintenanceReports,
  assessments: DANGER_ZONE_LABELS.blockers.compatibilityAssessments,
}

export function ResidentDangerZone({ residentId, residentCode }: Props) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [blockerReport, setBlockerReport] = useState<Record<string, number> | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEligibleCode = /test|demo/i.test(residentCode)

  const blockerText = useMemo(() => {
    if (!blockerReport) return ''
    return Object.entries(blockerReport)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${RESIDENT_BLOCKER_LABELS[key] || key}: ${count}`)
      .join(', ')
  }, [blockerReport])

  return (
    <section className="mt-8 p-4 sm:p-5 border-2 border-red-300 rounded-lg bg-red-50" aria-labelledby="resident-danger-zone-title">
      <h2 id="resident-danger-zone-title" className="text-base sm:text-lg font-semibold text-red-900">{DANGER_ZONE_LABELS.title}</h2>
      <p className="text-sm text-red-800 mt-1 leading-relaxed">
        {DANGER_ZONE_LABELS.description}
      </p>

      {!isEligibleCode && (
        <p className="mt-3 text-sm text-red-700">
          {DANGER_ZONE_LABELS.notTestResident}
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
          <p><strong>{DANGER_ZONE_LABELS.blockerReport}</strong> {blockerText || DANGER_ZONE_LABELS.noDetails}</p>
          <button
            type="button"
            className="mt-2 text-xs underline min-h-[44px] px-2 rounded hover:bg-amber-100"
            onClick={async () => {
              const ts = new Date().toISOString()
              await navigator.clipboard.writeText(`Delete Blocker Report | Type: Resident | Code: ${residentCode} | Timestamp: ${ts} | Details: ${blockerText}`)
              setFeedback({ kind: 'success', text: DANGER_ZONE_LABELS.copiedToClipboard })
            }}
          >
            {DANGER_ZONE_LABELS.copyReport}
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={DANGER_ZONE_LABELS.confirmLabel}
          className="input min-h-[44px]"
          disabled={!isEligibleCode || isPending}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={DANGER_ZONE_LABELS.reasonLabel}
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
            const result = await hardDeleteResidentProtected(residentId, confirmation, reason)
            if (!result.success) {
              setFeedback({ kind: 'error', text: result.error || DANGER_ZONE_LABELS.deleteFailed })
              setBlockerReport(result.blockerReport || null)
              return
            }
            setFeedback({ kind: 'success', text: DANGER_ZONE_LABELS.deleteSuccess })
            router.push('/residents?view=all')
            router.refresh()
          })
        }}
      >
        {DANGER_ZONE_LABELS.deleteButton}
      </button>
    </section>
  )
}
