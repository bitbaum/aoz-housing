import Link from 'next/link'
import { SATISFACTION_EMOJIS } from '@/lib/constants'

interface Props {
  days: number
  totalCheckIns: number
  avgSatisfaction: string | null
  satisfactionCounts: number[]
  lowSatisfactionCount: number
}

export function SatisfactionChart({
  days,
  totalCheckIns,
  avgSatisfaction,
  satisfactionCounts,
  lowSatisfactionCount,
}: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Zufriedenheit ({days} Tage)
        </h2>
        <Link href="/placements" className="inline-flex items-center min-h-[44px] px-1 text-sm text-aoz-primary hover:underline">
          Alle Check-ins
        </Link>
      </div>
      {totalCheckIns === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Keine Check-ins in diesem Zeitraum
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-4xl" aria-hidden="true">
              {avgSatisfaction && parseFloat(avgSatisfaction) >= 4 ? '🙂' :
               avgSatisfaction && parseFloat(avgSatisfaction) >= 3 ? '😐' : '😕'}
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgSatisfaction}/5</p>
              <p className="text-sm text-gray-500">Ø aus {totalCheckIns} Check-ins</p>
            </div>
            {lowSatisfactionCount > 0 && (
              <div className="ml-auto text-right">
                <p className="text-status-warning-text font-semibold">{lowSatisfactionCount}</p>
                <p className="text-sm text-gray-500">mit Bedenken</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {satisfactionCounts.map((count, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-8 text-lg text-center" aria-hidden="true">{SATISFACTION_EMOJIS[index]}</span>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        index >= 3 ? 'bg-status-success' :
                        index === 2 ? 'bg-status-warning' : 'bg-status-error'
                      }`}
                      style={{ width: `${totalCheckIns > 0 ? (count / totalCheckIns) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-sm text-gray-500 text-right">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
