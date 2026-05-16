import type { ScoreLevel, HarmonyLevel, HealthLevel } from './thresholds'

export const SCORE_TOKENS: Record<ScoreLevel, { bg: string; text: string; soft: string }> = {
  excellent: { bg: 'bg-score-excellent', text: 'text-green-700',  soft: 'bg-score-excellent/15 text-green-700' },
  good:      { bg: 'bg-score-good',      text: 'text-lime-700',   soft: 'bg-score-good/15 text-lime-700' },
  moderate:  { bg: 'bg-score-medium',    text: 'text-amber-700',  soft: 'bg-score-medium/15 text-amber-700' },
  low:       { bg: 'bg-score-low',       text: 'text-orange-700', soft: 'bg-score-low/15 text-orange-700' },
  critical:  { bg: 'bg-score-critical',  text: 'text-red-700',    soft: 'bg-score-critical/15 text-red-700' },
}

export const HARMONY_TOKENS: Record<HarmonyLevel, string> = {
  excellent:  'bg-score-excellent/15 text-green-700',
  good:       'bg-score-good/15 text-lime-700',
  moderate:   'bg-score-medium/15 text-amber-700',
  concerning: 'bg-score-low/15 text-orange-700',
  critical:   'bg-score-critical/15 text-red-700',
}

export const HEALTH_TOKENS: Record<HealthLevel, string> = {
  excellent: 'text-green-700 bg-score-excellent/15',
  good:      'text-amber-700 bg-score-medium/15',
  moderate:  'text-orange-700 bg-score-low/15',
  critical:  'text-red-700 bg-score-critical/15',
}
