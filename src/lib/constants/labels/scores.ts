/**
 * Score-related labels: compatibility, harmony, health, trends
 */

export const SCORE_TYPE_LABELS: Record<string, string> = {
  compatibility: 'Kompatibilität',
  fit: 'Passgenauigkeit',
  harmony: 'Harmonie',
}

export const SCORE_LEVEL_EXPLANATIONS: Record<string, { description: string; recommendation: string }> = {
  excellent: {
    description: 'Sehr hohe Übereinstimmung bei Lebensstil und Präferenzen.',
    recommendation: 'Ideale Platzierung empfohlen.',
  },
  good: {
    description: 'Gute Übereinstimmung mit wenigen Unterschieden.',
    recommendation: 'Gute Option für Platzierung.',
  },
  moderate: {
    description: 'Moderate Übereinstimmung mit einigen Abweichungen.',
    recommendation: 'Mit Vorsicht platzieren, regelmässige Check-ins.',
  },
  low: {
    description: 'Geringe Übereinstimmung, potenzielle Konflikte.',
    recommendation: 'Nur platzieren wenn keine Alternativen.',
  },
  critical: {
    description: 'Sehr geringe Übereinstimmung, hohe Konfliktgefahr.',
    recommendation: 'Nicht zusammen platzieren.',
  },
}

export const HARMONY_STATUS_LABELS: Record<string, string> = {
  excellent: 'Harmonisch',
  good: 'Gut',
  moderate: 'Aufmerksam',
  concerning: 'Angespannt',
  critical: 'Kritisch',
}

export const COMPATIBILITY_SCORE_LABELS: Record<string, string> = {
  excellent: 'Sehr gut',
  good: 'Gut',
  moderate: 'Mittel',
  low: 'Niedrig',
  critical: 'Kritisch',
}

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  excellent: 'Gut',
  good: 'OK',
  moderate: 'Aufmerksamkeit',
  critical: 'Kritisch',
}

export const SCORE_LEVEL_ACTION_LABELS: Record<string, string> = {
  excellent: 'Empfohlen',
  good: 'Gute Option',
  moderate: 'Mit Begleitung',
  low: 'Vermeiden',
  critical: 'Blockiert',
}

export const TREND_LABELS: Record<string, string> = {
  good: 'Positiv',
  warning: 'Warnung',
  neutral: 'Neutral',
}

export const COMPATIBILITY_DIMENSION_LABELS: Record<string, { label: string; description: string }> = {
  lifestyle: { label: 'Lebensstil', description: 'Schlaf, Lärm, Sauberkeit' },
  social:    { label: 'Sozial',     description: 'Sprache, Umgang' },
  practical: { label: 'Praktisch',  description: 'Rauchen, Küche' },
  risk:      { label: 'Risiko',     description: 'Konfliktpotenzial' },
}
