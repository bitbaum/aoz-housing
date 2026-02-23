/**
 * Column configurations for CSV export.
 * German headers for user-facing CSV files.
 */

export interface ExportColumn<T = Record<string, unknown>> {
  key: string
  header: string // German
  transform?: (value: unknown, row: T) => string
}

function formatDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'string' && v) return new Date(v).toISOString().split('T')[0]
  return ''
}

function formatArray(v: unknown): string {
  return Array.isArray(v) ? v.join(', ') : String(v || '')
}

export const EXPORT_COLUMNS: Record<string, ExportColumn[]> = {
  residents: [
    { key: 'code', header: 'Code' },
    { key: 'status', header: 'Status' },
    { key: 'ageRange', header: 'Altersgruppe' },
    { key: 'gender', header: 'Geschlecht' },
    { key: 'familyStatus', header: 'Familienstatus' },
    { key: 'sleepSchedule', header: 'Schlafrhythmus' },
    { key: 'noiseTolerance', header: 'Lärmtoleranz' },
    { key: 'cleanlinessLevel', header: 'Sauberkeit' },
    { key: 'socialStyle', header: 'Sozialstil' },
    { key: 'smokingStatus', header: 'Raucherstatus' },
    { key: 'mobilityNeeds', header: 'Mobilitätsbedarf' },
    { key: 'supportLevel', header: 'Unterstützungsstufe' },
    { key: 'languages', header: 'Sprachen', transform: formatArray },
    { key: 'createdAt', header: 'Erstellt am', transform: formatDate },
  ],
  incidents: [
    { key: 'id', header: 'ID' },
    { key: 'date', header: 'Datum', transform: formatDate },
    { key: 'category', header: 'Kategorie' },
    { key: 'type', header: 'Typ' },
    { key: 'severity', header: 'Schweregrad' },
    { key: 'description', header: 'Beschreibung' },
    { key: 'resolution', header: 'Lösung' },
    { key: 'resolvedAt', header: 'Gelöst am', transform: formatDate },
  ],
  placements: [
    { key: 'id', header: 'ID' },
    { key: 'startDate', header: 'Startdatum', transform: formatDate },
    { key: 'endDate', header: 'Enddatum', transform: formatDate },
    { key: 'status', header: 'Status' },
    { key: 'endReason', header: 'Endgrund' },
    { key: 'compatibilityScore', header: 'Kompatibilität' },
    { key: 'satisfactionRating', header: 'Zufriedenheit' },
  ],
  satisfaction: [
    { key: 'id', header: 'ID' },
    { key: 'createdAt', header: 'Datum', transform: formatDate },
    { key: 'checkInType', header: 'Typ' },
    { key: 'overallSatisfaction', header: 'Gesamtzufriedenheit' },
    { key: 'roommateRelations', header: 'Mitbewohner' },
    { key: 'facilitySatisfaction', header: 'Einrichtung' },
    { key: 'safetyFeeling', header: 'Sicherheit' },
    { key: 'concerns', header: 'Bedenken' },
    { key: 'improvements', header: 'Verbesserungen' },
  ],
}
