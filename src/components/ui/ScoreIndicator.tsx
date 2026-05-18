/**
 * Score indicator components for compatibility scores
 */

import {
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getHarmonyColorClass,
  getHealthColorClass,
  getHealthLevel,
  type HarmonyStatus,
} from '@/lib/utils/formatting'
import { HARMONY_STATUS_LABELS, HEALTH_STATUS_LABELS } from '@/lib/constants/labels'

interface ScoreDisplayProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreDisplay({ score, showLabel = true, size = 'md' }: ScoreDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
  }

  return (
    <span className={`${getScoreColorClass(score)} ${sizeClasses[size]}`}>
      {score}%{showLabel && ` - ${getScoreLabel(score)}`}
    </span>
  )
}

interface ScoreBadgeProps {
  score: number
  showPercent?: boolean
}

export function ScoreBadge({ score, showPercent = true }: ScoreBadgeProps) {
  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded ${getScoreBgClass(score)} text-xs font-medium`}>
      {showPercent ? `${score}%` : getScoreLabel(score)}
    </span>
  )
}

interface HarmonyBadgeProps {
  status: HarmonyStatus
}

export function HarmonyBadge({ status }: HarmonyBadgeProps) {
  return (
    <span className={`badge ${getHarmonyColorClass(status)}`}>
      {HARMONY_STATUS_LABELS[status]}
    </span>
  )
}

interface HealthIndicatorProps {
  label: string
  score: number
  description?: string
  tooltip?: string
}

export function HealthIndicator({ label, score, description, tooltip }: HealthIndicatorProps) {
  const colorClass = getHealthColorClass(score)
  const statusLabel = HEALTH_STATUS_LABELS[getHealthLevel(score)]

  return (
    <div className="text-center group relative">
      <div
        className={`inline-flex items-center justify-center w-16 h-16 rounded-lg ${colorClass} mb-2 cursor-help`}
        title={tooltip}
      >
        <span className="text-xl font-bold">{score}</span>
      </div>
      <p className="font-medium text-ui-text">{label}</p>
      {description && (
        <p className="text-xs text-ui-muted">{description}</p>
      )}
      <p className={`text-xs mt-1 ${colorClass.split(' ')[0]}`}>
        {statusLabel}
      </p>
    </div>
  )
}
