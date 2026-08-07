/**
 * AI form assistance labels
 */

export const AI_FORM_LABELS = {
  fillTitle: 'Aus Gesprächsnotizen ausfüllen',
  fillHint:
    'Beschreibe das Aufnahmegespräch in eigenen Worten. Das Formular wird ausgefüllt — überprüfe jede Angabe, bevor du speicherst.',
  fillPlaceholder:
    'z.B. Frau, 34, alleinstehend, spricht Arabisch und etwas Deutsch. Steht früh auf, hätte gerne ein Einzelzimmer. Raucht draussen, isst halal. Reagiert empfindlich auf Lärm.',
  fillSubmit: 'Ausfüllen',

  refineTitle: 'Änderung beschreiben',
  refineHint: 'Sag, was anders sein soll — z.B. «spricht auch Französisch» oder «doch Nichtraucherin».',
  refinePlaceholder: 'z.B. Lärmtoleranz eher 2, und sie kann ein Zimmer teilen',
  refineSubmit: 'Übernehmen',

  working: 'Einen Moment…',
  undo: 'Rückgängig',
  aiMarker: 'KI',
  aiMarkerTitle: 'Von der KI ausgefüllt — bitte prüfen',
  changedOne: '1 Feld aktualisiert',
  changedMany: (count: number) => `${count} Felder aktualisiert`,
} as const

export const AI_FORM_ERRORS = {
  notConfigured: 'KI-Assistent nicht konfiguriert (ANTHROPIC_API_KEY fehlt).',
  unauthenticated: 'Nicht authentifiziert',
  rateLimited: (seconds: number) => `Zu viele Anfragen. Bitte warten Sie ${seconds} Sekunden.`,
} as const
