import Link from 'next/link'
import { SOCIAL_STYLE_LABELS, PORTAL_LABELS, getLabel } from '@/lib/constants'
import { getScoreBgClass, getScoreLabel } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface Roommate {
  id: string
  code: string
  socialStyle: string | null
}

interface CompatibilityScore {
  residentId: string
  comparedWithId: string
  overallScore: number
}

interface PortalRoommatesCardProps {
  roommates: Roommate[]
  compatibilityScores: CompatibilityScore[]
}

export function PortalRoommatesCard({ roommates, compatibilityScores }: PortalRoommatesCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.roommates}</h2>
        <Link href="/portal/roommates" className="text-sm text-aoz-primary hover:underline">
          {PORTAL_LABELS.dashboard.showAll}
        </Link>
      </div>
      <div className="space-y-3">
        {roommates.slice(0, DISPLAY_LIMITS.dashboardItems).map((roommate) => {
          const score = compatibilityScores.find(
            s => s.residentId === roommate.id || s.comparedWithId === roommate.id
          )?.overallScore
          return (
            <div
              key={roommate.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-aoz-secondary text-white rounded-full flex items-center justify-center font-medium">
                  {roommate.code.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{roommate.code}</p>
                  <p className="text-sm text-gray-500">
                    {roommate.socialStyle ? getLabel(SOCIAL_STYLE_LABELS, roommate.socialStyle) : '–'}
                  </p>
                </div>
              </div>
              {score && (
                <CompatibilityBadge score={score} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompatibilityBadge({ score }: { score: number }) {
  return (
    <span className={`badge ${getScoreBgClass(score)}`}>
      {getScoreLabel(score)}
    </span>
  )
}
