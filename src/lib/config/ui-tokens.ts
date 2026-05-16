import type { ScoreLevel, HarmonyLevel, HealthLevel } from './thresholds'

export const SCORE_TOKENS: Record<ScoreLevel, { bg: string; text: string; soft: string }> = {
  excellent: { bg: 'bg-score-excellent', text: 'text-green-700',  soft: 'bg-green-100 text-green-800' },
  good:      { bg: 'bg-score-good',      text: 'text-lime-700',   soft: 'bg-emerald-100 text-emerald-800' },
  moderate:  { bg: 'bg-score-medium',    text: 'text-amber-700',  soft: 'bg-yellow-100 text-yellow-800' },
  low:       { bg: 'bg-score-low',       text: 'text-orange-700', soft: 'bg-orange-100 text-orange-800' },
  critical:  { bg: 'bg-score-critical',  text: 'text-red-700',    soft: 'bg-red-100 text-red-800' },
}

export const HARMONY_TOKENS: Record<HarmonyLevel, string> = {
  excellent:  'bg-green-100 text-green-800',
  good:       'bg-emerald-100 text-emerald-800',
  moderate:   'bg-yellow-100 text-yellow-800',
  concerning: 'bg-orange-100 text-orange-800',
  critical:   'bg-red-100 text-red-800',
}

export const HEALTH_TOKENS: Record<HealthLevel, string> = {
  excellent: 'text-green-600 bg-green-100',
  good:      'text-yellow-600 bg-yellow-100',
  moderate:  'text-orange-600 bg-orange-100',
  critical:  'text-red-600 bg-red-100',
}
