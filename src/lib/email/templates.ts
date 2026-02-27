/**
 * Email templates — all content in German (Swiss spelling).
 * Each function returns { subject, html } for use with sendEmail/notifyStaff.
 */

// -- Template data interfaces --

interface OverdueIncident {
  id: string
  description: string
  severity: string
  housingUnitCode?: string
  nextFollowUpDate: Date
}

interface OverdueResident {
  code: string
  supportLevel: string
  lastCheckInDate: Date | null
  daysSinceLastCheckIn: number
}

interface LowSatisfactionData {
  residentCode: string
  housingUnitCode: string
  overallSatisfaction: number
  concerns?: string | null
}

interface TransferRequestData {
  residentCode: string
  currentUnitCode: string
  reason: string
  targetUnitCode?: string
}

interface NewIncidentData {
  residentCode: string
  housingUnitCode: string
  category: string
  type: string
  severity: string
  description: string
  subjectCode?: string
  requestedMediation: boolean
}

// -- HTML escaping for user-controlled data --

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// -- Shared styles --

const STYLES = {
  table: 'border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;',
  th: 'background-color: #f3f4f6; padding: 8px 12px; text-align: left; border: 1px solid #d1d5db; font-weight: 600;',
  td: 'padding: 8px 12px; border: 1px solid #d1d5db;',
  header: 'font-family: Arial, sans-serif; color: #1f2937; margin-bottom: 16px;',
  paragraph: 'font-family: Arial, sans-serif; color: #374151; font-size: 14px; line-height: 1.5;',
  warning: 'background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin-bottom: 16px;',
  footer: 'font-family: Arial, sans-serif; color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;',
} as const

function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return '#dc2626'
    case 'HIGH': return '#dc2626'
    case 'MEDIUM': return '#f59e0b'
    case 'LOW': return '#6b7280'
    default: return '#374151'
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return 'Kritisch'
    case 'HIGH': return 'Hoch'
    case 'MEDIUM': return 'Mittel'
    case 'LOW': return 'Niedrig'
    default: return severity
  }
}

function supportLevelLabel(level: string): string {
  switch (level) {
    case 'INTENSIVE': return 'Intensiv'
    case 'ELEVATED': return 'Erhöht'
    case 'STANDARD': return 'Standard'
    default: return level
  }
}

function supportLevelColor(level: string): string {
  switch (level) {
    case 'INTENSIVE': return '#dc2626'
    case 'ELEVATED': return '#f59e0b'
    default: return '#374151'
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function stars(rating: number): string {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating)
}

function emailFooter(): string {
  return `<p style="${STYLES.footer}">Diese E-Mail wurde automatisch vom AOZ Housing System generiert.</p>`
}

// -- Template functions --

export function incidentFollowUpReminder(incidents: OverdueIncident[]): { subject: string; html: string } {
  const subject = `[AOZ Housing] ${incidents.length} überfällige Nachverfolgungen`

  const rows = incidents.map(i => `
    <tr>
      <td style="${STYLES.td}">${i.id.slice(-8)}</td>
      <td style="${STYLES.td}">${escapeHtml(i.description)}</td>
      <td style="${STYLES.td}"><span style="color: ${severityColor(i.severity)}; font-weight: 600;">${severityLabel(i.severity)}</span></td>
      <td style="${STYLES.td}">${i.housingUnitCode ? escapeHtml(i.housingUnitCode) : '-'}</td>
      <td style="${STYLES.td}">${formatDate(i.nextFollowUpDate)}</td>
    </tr>
  `).join('')

  const html = `
    <h2 style="${STYLES.header}">Überfällige Nachverfolgungen</h2>
    <p style="${STYLES.paragraph}">${incidents.length} Vorfall/Vorfälle benötigen dringend eine Nachverfolgung:</p>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th}">ID</th>
          <th style="${STYLES.th}">Beschreibung</th>
          <th style="${STYLES.th}">Schweregrad</th>
          <th style="${STYLES.th}">Wohneinheit</th>
          <th style="${STYLES.th}">Fällig seit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${emailFooter()}
  `

  return { subject, html }
}

export function checkInReminder(overdueResidents: OverdueResident[]): { subject: string; html: string } {
  const subject = `[AOZ Housing] ${overdueResidents.length} Check-ins überfällig`

  const rows = overdueResidents.map(r => `
    <tr>
      <td style="${STYLES.td}">${escapeHtml(r.code)}</td>
      <td style="${STYLES.td}"><span style="color: ${supportLevelColor(r.supportLevel)}; font-weight: 600;">${supportLevelLabel(r.supportLevel)}</span></td>
      <td style="${STYLES.td}">${r.lastCheckInDate ? formatDate(r.lastCheckInDate) : 'Nie'}</td>
      <td style="${STYLES.td}">${r.daysSinceLastCheckIn} Tage</td>
    </tr>
  `).join('')

  const html = `
    <h2 style="${STYLES.header}">Überfällige Check-ins</h2>
    <p style="${STYLES.paragraph}">${overdueResidents.length} Bewohner benötigen einen Check-in:</p>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th}">Bewohner</th>
          <th style="${STYLES.th}">Betreuungsstufe</th>
          <th style="${STYLES.th}">Letzter Check-in</th>
          <th style="${STYLES.th}">Überfällig</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${emailFooter()}
  `

  return { subject, html }
}

export function lowSatisfactionAlert(data: LowSatisfactionData): { subject: string; html: string } {
  const subject = `[AOZ Housing] Niedrige Zufriedenheit: ${data.residentCode}`

  const html = `
    <div style="${STYLES.warning}">
      <h2 style="font-family: Arial, sans-serif; color: #991b1b; margin: 0 0 12px 0;">Niedrige Zufriedenheit gemeldet</h2>
      <p style="${STYLES.paragraph}">
        <strong>Bewohner:</strong> ${escapeHtml(data.residentCode)}<br>
        <strong>Wohneinheit:</strong> ${escapeHtml(data.housingUnitCode)}<br>
        <strong>Bewertung:</strong> <span style="font-size: 18px; color: #dc2626;">${stars(data.overallSatisfaction)}</span> (${data.overallSatisfaction}/5)
      </p>
      ${data.concerns ? `<p style="${STYLES.paragraph}"><strong>Anliegen:</strong> ${escapeHtml(data.concerns)}</p>` : ''}
    </div>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie die Situation und kontaktieren Sie den Bewohner zeitnah.</p>
    ${emailFooter()}
  `

  return { subject, html }
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'INTERPERSONAL': return 'Zwischenmenschlich'
    case 'MAINTENANCE': return 'Wartung'
    case 'SAFETY': return 'Sicherheit'
    case 'WELLBEING': return 'Wohlbefinden'
    default: return category
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'NOISE_COMPLAINT': return 'Lärmbeschwerde'
    case 'CLEANLINESS_DISPUTE': return 'Sauberkeitskonflikt'
    case 'PERSONAL_CONFLICT': return 'Persönlicher Konflikt'
    case 'CULTURAL_FRICTION': return 'Kulturelle Differenzen'
    case 'SPACE_DISPUTE': return 'Platzkonflikt'
    case 'SCHEDULE_CONFLICT': return 'Zeitplankonflikt'
    case 'SAFETY_CONCERN': return 'Sicherheitsbedenken'
    case 'PLUMBING': return 'Sanitär'
    case 'ELECTRICAL': return 'Elektrik'
    case 'HEATING_COOLING': return 'Heizung/Klima'
    case 'APPLIANCE': return 'Gerät defekt'
    case 'STRUCTURAL': return 'Bauschaden'
    case 'PEST_CONTROL': return 'Schädlinge'
    case 'SECURITY_SYSTEM': return 'Sicherheitssystem'
    case 'GENERAL_MAINTENANCE': return 'Allgemeine Wartung'
    case 'LOW_SATISFACTION': return 'Unzufriedenheit gemeldet'
    case 'OTHER': return 'Sonstiges'
    default: return type
  }
}

export function newIncidentNotification(data: NewIncidentData): { subject: string; html: string } {
  const subject = `[AOZ Housing] Neuer Vorfall: ${typeLabel(data.type)} (${severityLabel(data.severity)})`

  const html = `
    <div style="${STYLES.warning}">
      <h2 style="font-family: Arial, sans-serif; color: #991b1b; margin: 0 0 12px 0;">Neuer Vorfall gemeldet</h2>
      <p style="${STYLES.paragraph}">
        <strong>Gemeldet von:</strong> ${escapeHtml(data.residentCode)}<br>
        <strong>Wohneinheit:</strong> ${escapeHtml(data.housingUnitCode)}<br>
        <strong>Kategorie:</strong> ${categoryLabel(data.category)}<br>
        <strong>Typ:</strong> ${typeLabel(data.type)}<br>
        <strong>Schweregrad:</strong> <span style="color: ${severityColor(data.severity)}; font-weight: 600;">${severityLabel(data.severity)}</span>
        ${data.subjectCode ? `<br><strong>Betroffene Person:</strong> ${escapeHtml(data.subjectCode)}` : ''}
        ${data.requestedMediation ? `<br><strong>Vermittlung gewünscht:</strong> Ja` : ''}
      </p>
    </div>
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
      <h3 style="font-family: Arial, sans-serif; color: #374151; margin: 0 0 8px 0; font-size: 14px;">Beschreibung</h3>
      <p style="${STYLES.paragraph}">${escapeHtml(data.description)}</p>
    </div>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie den Vorfall im AOZ Housing System.</p>
    ${emailFooter()}
  `

  return { subject, html }
}

// -- Staff invite template --

interface StaffInviteData {
  recipientEmail: string
  staffCode: string
  invitedByName: string
  appUrl: string
}

export function staffInviteEmail(data: StaffInviteData): { subject: string; html: string } {
  const subject = `Einladung zu AOZ Housing`
  const loginUrl = `${data.appUrl}/login?code=${data.staffCode}`

  const html = `
    <h2 style="${STYLES.header}">Willkommen bei AOZ Housing</h2>
    <p style="${STYLES.paragraph}">
      ${escapeHtml(data.invitedByName)} hat Sie zum AOZ Housing System eingeladen.
    </p>
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="font-family: Arial, sans-serif; color: #0369a1; font-size: 13px; margin: 0 0 8px 0;">Ihr persönlicher Zugangscode</p>
      <p style="font-family: monospace; font-size: 28px; font-weight: 700; color: #0c4a6e; letter-spacing: 3px; margin: 0 0 16px 0;">${escapeHtml(data.staffCode)}</p>
      <a href="${loginUrl}" style="display: inline-block; background-color: #0369a1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">
        Jetzt anmelden
      </a>
    </div>
    <p style="${STYLES.paragraph}">
      Oder öffnen Sie <a href="${data.appUrl}/login" style="color: #0369a1;">${data.appUrl}/login</a> und geben Sie Ihren Code manuell ein.
    </p>
    <p style="${STYLES.paragraph}">
      Bewahren Sie Ihren Code sicher auf — er ist Ihr persönlicher Zugang zum System.
    </p>
    ${emailFooter()}
  `

  return { subject, html }
}

export function newTransferRequestNotification(data: TransferRequestData): { subject: string; html: string } {
  const subject = `[AOZ Housing] Neue Verlegungsanfrage: ${data.residentCode}`

  const html = `
    <h2 style="${STYLES.header}">Neue Verlegungsanfrage</h2>
    <p style="${STYLES.paragraph}">
      <strong>Bewohner:</strong> ${escapeHtml(data.residentCode)}<br>
      <strong>Aktuelle Wohneinheit:</strong> ${escapeHtml(data.currentUnitCode)}<br>
      ${data.targetUnitCode ? `<strong>Gewünschte Wohneinheit:</strong> ${escapeHtml(data.targetUnitCode)}<br>` : ''}
      <strong>Grund:</strong> ${escapeHtml(data.reason)}
    </p>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie die Anfrage im AOZ Housing System.</p>
    ${emailFooter()}
  `

  return { subject, html }
}
