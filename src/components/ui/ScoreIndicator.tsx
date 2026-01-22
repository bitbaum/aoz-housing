/**
 * Score indicator components for compatibility scores
 */

import {
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getHarmonyColorClass,
  type HarmonyStatus,
} from '@/lib/utils/formatting'
import { HARMONY_STATUS_LABELS } from '@/lib/constants/labels'

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
}

export function HealthIndicator({ label, score, description }: HealthIndicatorProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600 bg-green-100'
    if (s >= 60) return 'text-yellow-600 bg-yellow-100'
    if (s >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getColor(score)} mb-2`}>
        <span className="text-xl font-bold">{score}</span>
      </div>
      <p className="font-medium text-gray-900">{label}</p>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}
