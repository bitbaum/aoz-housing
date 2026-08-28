/**
 * Documents a resident's file can hold — SSOT for categories and limits.
 *
 * This exists because a job coach had nowhere to put a CV. The role shipped,
 * the JOB care domain shipped, `job_goal` and `work_status` shipped, and the
 * one artefact the work actually revolves around could not be attached to
 * anyone.
 *
 * What belongs here is functional: what this person can show an employer. What
 * does not belong here is everything CLAUDE.md already forbids — no medical
 * documents, no asylum paperwork, no permit scans. Those are not "career
 * evidence" and this product must not become the place they accumulate. The
 * category list is deliberately short for that reason: a long list invites
 * someone to file a Ausweis under "Sonstiges".
 */

/** Vocabulary, not behaviour — adding one is a line here, never a migration. */
export const DOCUMENT_CATEGORIES = [
  'CV',
  'CERTIFICATE',
  'REFERENCE',
  'APPLICATION',
  'OTHER',
] as const
export type DocumentCategoryId = (typeof DOCUMENT_CATEGORIES)[number]

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategoryId, string> = {
  CV: 'Lebenslauf',
  CERTIFICATE: 'Zeugnis / Zertifikat',
  REFERENCE: 'Referenz / Arbeitsbestätigung',
  APPLICATION: 'Bewerbung',
  OTHER: 'Sonstiges',
}

export const DOCUMENT_CATEGORY_HINTS: Record<DocumentCategoryId, string> = {
  CV: 'Der Lebenslauf, den die Person Arbeitgebenden zeigt.',
  CERTIFICATE: 'Schulische oder berufliche Abschlüsse und Kursbestätigungen.',
  REFERENCE: 'Was frühere Einsatzorte oder Arbeitgebende bestätigt haben.',
  APPLICATION: 'Motivationsschreiben und eingereichte Bewerbungen.',
  OTHER: 'Anderes, das für die Stellensuche nützt — keine Ausweise, keine Arztberichte.',
}

export function isDocumentCategory(value: string): value is DocumentCategoryId {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value)
}

/**
 * What may be uploaded, as an ALLOWLIST.
 *
 * SVG and HTML are absent and must stay absent: both can carry script, and a
 * document store is a place where one user's file is later opened by another.
 * A denylist would have to anticipate every executable type; an allowlist only
 * has to name the ones a CV is actually written in.
 */
export const DOCUMENT_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export function isAllowedDocumentType(mimeType: string): boolean {
  return Object.prototype.hasOwnProperty.call(DOCUMENT_MIME_TYPES, mimeType)
}

/**
 * 5 MB. A scanned two-page CV clears this comfortably; a phone photo of a
 * certificate usually does too. The avatar cap is 500 KB because an avatar is
 * resized in the browser first — a document is not, and refusing a real
 * scanned reference would just push it into an email nobody can find later.
 */
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024

/**
 * A filename safe to put in a Content-Disposition header.
 *
 * Strips path separators, quotes and control characters — the header is parsed
 * by the browser, so an unescaped quote or newline there is a response-splitting
 * primitive, not a cosmetic problem. Non-ASCII is preserved separately by the
 * caller via RFC 5987 `filename*`, so names in any script survive.
 */
export function safeDownloadName(fileName: string): string {
  const cleaned = fileName
    .replace(/[\\/]/g, '_')
    .replace(/"/g, '')
    // Control characters, CR and LF included. Written with explicit \u
    // escapes: a literal range is easy to mistype into one that strips
    // ordinary punctuation, and easy to leave a raw NUL in the source.
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
  return cleaned.slice(0, 120) || 'dokument'
}

export const DOCUMENT_LABELS = {
  title: 'Dokumente',
  subtitle: 'Lebenslauf, Zeugnisse und Referenzen — was diese Person zeigen kann.',
  empty: 'Noch keine Dokumente.',
  add: 'Dokument hinzufügen',
  fileLabel: 'Datei',
  titleLabel: 'Titel',
  categoryLabel: 'Art',
  upload: 'Hochladen',
  uploading: 'Wird hochgeladen...',
  download: 'Herunterladen',
  remove: 'Entfernen',
  uploadedBy: 'Hochgeladen von',
  limitHint: 'PDF, Word oder Bild, höchstens 5 MB. Keine Ausweise und keine Arztberichte.',
  tooLarge: 'Die Datei ist grösser als 5 MB.',
  wrongType: 'Dieses Dateiformat wird nicht unterstützt.',
  missingFile: 'Bitte eine Datei auswählen.',
} as const
