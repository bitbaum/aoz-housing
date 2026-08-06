'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuickCheckIn } from '@/lib/actions/satisfaction'
import { PLACEMENT_LIST_LABELS } from '@/lib/constants/labels'

const EMOJIS = ['😢', '😕', '😐', '🙂', '😊']

interface PlacementCheckInProps {
  placementId: string
  isOverdue: boolean
  daysSinceCheckIn: number | null
  lastSatisfaction: number | null
  weeksSinceStart: number
  checkInCount: number
}

export function PlacementCheckIn({
  placementId,
  isOverdue,
  daysSinceCheckIn,
  lastSatisfaction,
  weeksSinceStart,
  checkInCount,
}: PlacementCheckInProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<number | null>(null)
  const [showTapper, setShowTapper] = useState(false)
  const router = useRouter()

  const handleTap = (value: number) => {
    if (value <= 3) {
      router.push(`/placements/${placementId}/checkin`)
      return
    }
    startTransition(async () => {
      const result = await createQuickCheckIn({
        placementId,
        overallSatisfaction: value,
        checkInType: checkInCount === 0 ? 'INITIAL' : 'REGULAR',
        weekNumber: weeksSinceStart,
      })
      if (result.success) {
        setSaved(value)
        setShowTapper(false)
        router.refresh()
      }
    })
  }

  if (saved !== null) {
    return (
      <div className="text-right">
        <p className="text-xs text-ui-muted">Check-in</p>
        <span className="text-lg">{EMOJIS[saved - 1]}</span>
        <p className="text-xs text-status-success-text">{PLACEMENT_LIST_LABELS.checkInSaved}</p>
      </div>
    )
  }

  // No check-in yet and not overdue — show placeholder, reveal tapper on click
  if (!lastSatisfaction && !isOverdue && !showTapper) {
    return (
      <button
        onClick={() => setShowTapper(true)}
        className="text-right hover:bg-ui-subtle px-3 py-2 rounded-lg transition-colors"
        title={PLACEMENT_LIST_LABELS.checkInStart}
      >
        <p className="text-xs text-ui-muted">{PLACEMENT_LIST_LABELS.checkInNone}</p>
        <p className="text-xs text-brand-primary mt-0.5">{PLACEMENT_LIST_LABELS.checkInCapture}</p>
      </button>
    )
  }

  // Has a recent check-in and not overdue — show status, allow re-check on click
  if (lastSatisfaction && !isOverdue && !showTapper) {
    return (
      <button
        onClick={() => setShowTapper(true)}
        className="text-right hover:bg-ui-subtle px-3 py-2 rounded-lg transition-colors"
        title={PLACEMENT_LIST_LABELS.checkInUpdate}
      >
        <p className="text-xs text-ui-muted">Check-in</p>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-lg">{EMOJIS[lastSatisfaction - 1]}</span>
          <span className="text-xs text-ui-muted">vor {daysSinceCheckIn}d</span>
        </div>
      </button>
    )
  }

  // Overdue or no check-in — show emoji tapper
  return (
    <div className={`px-3 py-2 rounded-lg ${isOverdue ? 'bg-status-warning/10' : ''}`}>
      <p className={`text-xs mb-1 ${isOverdue ? 'text-status-warning font-medium' : 'text-ui-muted'}`}>
        {isOverdue ? PLACEMENT_LIST_LABELS.checkInOverdue : 'Check-in'}
      </p>
      <div className={`flex gap-1 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleTap(i + 1)}
            disabled={isPending}
            className="text-xl hover:scale-125 transition-transform focus:outline-none"
            title={`${i + 1}/5`}
          >
            {emoji}
          </button>
        ))}
      </div>
      {lastSatisfaction && (
        <p className="text-xs text-ui-muted mt-0.5">
          Letzter: {EMOJIS[lastSatisfaction - 1]} vor {daysSinceCheckIn}d
        </p>
      )}
    </div>
  )
}
