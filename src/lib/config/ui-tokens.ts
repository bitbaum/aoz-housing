import type { ScoreLevel } from './thresholds'

/**
 * ScoreLevel → Tailwind class tokens.
 * bg uses semantic score-* tokens; text uses accessible dark variants.
 */
export const SCORE_TOKENS: Record<ScoreLevel, { bg: string; text: string }> = {
  excellent: { bg: 'bg-score-excellent', text: 'text-green-700' },
  good:      { bg: 'bg-score-good',      text: 'text-lime-700' },
  moderate:  { bg: 'bg-score-medium',    text: 'text-amber-700' },
  low:       { bg: 'bg-score-low',       text: 'text-orange-700' },
  critical:  { bg: 'bg-score-critical',  text: 'text-red-700' },
}
