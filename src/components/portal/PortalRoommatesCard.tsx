import { getScoreBgClass, getScoreLevel } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { ResidentAvatar } from '@/components/portal/ResidentAvatar'
import { residentName } from '@/lib/utils/resident-name'
import { getRequestTranslator } from '@/lib/i18n/request'
import type { MessageKey } from '@/lib/i18n'

interface Roommate {
  id: string
  code: string
  displayName: string | null
  photoVersion?: Date | null
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

const SOCIAL_STYLE_KEYS: Record<string, MessageKey> = {
  INTROVERTED: 'socialStyle.INTROVERTED',
  MODERATE: 'socialStyle.MODERATE',
  EXTROVERTED: 'socialStyle.EXTROVERTED',
}

const SCORE_LEVEL_KEYS: Record<string, MessageKey> = {
  excellent: 'scores.excellent',
  good: 'scores.good',
  moderate: 'scores.moderate',
  low: 'scores.low',
  critical: 'scores.critical',
}

export async function PortalRoommatesCard({ roommates, compatibilityScores }: PortalRoommatesCardProps) {
  const { t } = await getRequestTranslator()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{t('dashboard.roommates')}</h2>
      </div>
      <div className="space-y-3">
        {roommates.slice(0, DISPLAY_LIMITS.dashboardItems).map((roommate) => {
          const score = compatibilityScores.find(
            s => s.residentId === roommate.id || s.comparedWithId === roommate.id
          )?.overallScore
          return (
            <div
              key={roommate.id}
              className="flex items-center justify-between p-3 bg-ui-subtle rounded-lg"
            >
              <div className="flex items-center gap-3">
                <ResidentAvatar resident={roommate} photoVersion={roommate.photoVersion} />
                <div>
                  <p className="font-medium text-ui-text">{residentName(roommate)}</p>
                  <p className="text-sm text-ui-muted">
                    {roommate.socialStyle && SOCIAL_STYLE_KEYS[roommate.socialStyle]
                      ? t(SOCIAL_STYLE_KEYS[roommate.socialStyle])
                      : '–'}
                  </p>
                </div>
              </div>
              {score && (
                <span className={`badge ${getScoreBgClass(score)}`}>
                  {t(SCORE_LEVEL_KEYS[getScoreLevel(score)])}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
