import type { ScoreLevel, HarmonyLevel, HealthLevel } from './thresholds'

export const SCORE_TOKENS: Record<ScoreLevel, { bg: string; text: string; soft: string }> = {
  excellent: { bg: 'bg-score-excellent', text: 'text-score-excellent-text', soft: 'bg-score-excellent/15 text-score-excellent-text' },
  good:      { bg: 'bg-score-good',      text: 'text-score-good-text',      soft: 'bg-score-good/15 text-score-good-text' },
  moderate:  { bg: 'bg-score-medium',    text: 'text-score-medium-text',    soft: 'bg-score-medium/15 text-score-medium-text' },
  low:       { bg: 'bg-score-low',       text: 'text-score-low-text',       soft: 'bg-score-low/15 text-score-low-text' },
  critical:  { bg: 'bg-score-critical',  text: 'text-score-critical-text',  soft: 'bg-score-critical/15 text-score-critical-text' },
}

export const HARMONY_TOKENS: Record<HarmonyLevel, string> = {
  excellent:  'bg-score-excellent/15 text-score-excellent-text',
  good:       'bg-score-good/15 text-score-good-text',
  moderate:   'bg-score-medium/15 text-score-medium-text',
  concerning: 'bg-score-low/15 text-score-low-text',
  critical:   'bg-score-critical/15 text-score-critical-text',
}

export const HEALTH_TOKENS: Record<HealthLevel, string> = {
  excellent: 'text-score-excellent-text bg-score-excellent/15',
  good:      'text-score-medium-text bg-score-medium/15',
  moderate:  'text-score-low-text bg-score-low/15',
  critical:  'text-score-critical-text bg-score-critical/15',
}
