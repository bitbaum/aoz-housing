/**
 * Email templates — all content in German (Swiss spelling).
 * Each function returns { subject, html } for use with sendEmail/notifyStaff.
 */

import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_CATEGORY_LABELS,
  SUPPORT_LEVEL_LABELS,
  INCIDENT_TYPE_LABELS,
} from '@/lib/constants/labels'
import { BRAND } from '@/lib/config/brand'
import { EMAIL_COLORS } from './tokens'

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

const FONT = 'font-family: Arial, sans-serif;'

const STYLES = {
  table: `border-collapse: collapse; width: 100%; ${FONT} font-size: 14px;`,
  th: `background-color: ${EMAIL_COLORS.surfaceHeader}; padding: 8px 12px; text-align: left; border: 1px solid ${EMAIL_COLORS.borderStrong}; font-weight: 600;`,
  td: `padding: 8px 12px; border: 1px solid ${EMAIL_COLORS.borderStrong};`,
  header: `${FONT} color: ${EMAIL_COLORS.text}; margin-bottom: 16px;`,
  paragraph: `${FONT} color: ${EMAIL_COLORS.textBody}; font-size: 14px; line-height: 1.5;`,
  warning: `background-color: ${EMAIL_COLORS.dangerBg}; border: 1px solid ${EMAIL_COLORS.dangerBorder}; border-radius: 6px; padding: 16px; margin-bottom: 16px;`,
  footer: `${FONT} color: ${EMAIL_COLORS.textMuted}; font-size: 12px; margin-top: 24px; border-top: 1px solid ${EMAIL_COLORS.border}; padding-top: 12px;`,
  panel: `background-color: ${EMAIL_COLORS.surfaceSubtle}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 6px; padding: 16px; margin-bottom: 16px;`,
  alertHeading: `${FONT} color: ${EMAIL_COLORS.dangerStrong}; margin: 0 0 12px 0;`,
  codePanel: `background-color: ${EMAIL_COLORS.infoBg}; border: 1px solid ${EMAIL_COLORS.infoBorder}; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;`,
} as const

function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return EMAIL_COLORS.danger
    case 'HIGH': return EMAIL_COLORS.danger
    case 'MEDIUM': return EMAIL_COLORS.warning
    case 'LOW': return EMAIL_COLORS.muted
    default: return EMAIL_COLORS.textBody
  }
}

const severityLabel = (severity: string) => INCIDENT_SEVERITY_LABELS[severity] ?? severity
const supportLevelLabel = (level: string) => SUPPORT_LEVEL_LABELS[level] ?? level

function supportLevelColor(level: string): string {
  switch (level) {
    case 'INTENSIVE': return EMAIL_COLORS.danger
    case 'ELEVATED': return EMAIL_COLORS.warning
    default: return EMAIL_COLORS.textBody
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
  return `<p style="${STYLES.footer}">Diese E-Mail wurde automatisch vom ${BRAND.shortName} Wohnen System generiert.</p>`
}

// -- Template functions --

export function incidentFollowUpReminder(incidents: OverdueIncident[]): { subject: string; html: string } {
  const subject = `[${BRAND.shortName} Wohnen] ${incidents.length} überfällige Nachverfolgungen`

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
  const subject = `[${BRAND.shortName} Wohnen] ${overdueResidents.length} Check-ins überfällig`

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
  const subject = `[${BRAND.shortName} Wohnen] Niedrige Zufriedenheit: ${data.residentCode}`

  const html = `
    <div style="${STYLES.warning}">
      <h2 style="${STYLES.alertHeading}">Niedrige Zufriedenheit gemeldet</h2>
      <p style="${STYLES.paragraph}">
        <strong>Bewohner:</strong> ${escapeHtml(data.residentCode)}<br>
        <strong>Wohneinheit:</strong> ${escapeHtml(data.housingUnitCode)}<br>
        <strong>Bewertung:</strong> <span style="font-size: 18px; color: ${EMAIL_COLORS.danger};">${stars(data.overallSatisfaction)}</span> (${data.overallSatisfaction}/5)
      </p>
      ${data.concerns ? `<p style="${STYLES.paragraph}"><strong>Anliegen:</strong> ${escapeHtml(data.concerns)}</p>` : ''}
    </div>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie die Situation und kontaktieren Sie den Bewohner zeitnah.</p>
    ${emailFooter()}
  `

  return { subject, html }
}

const categoryLabel = (category: string) => INCIDENT_CATEGORY_LABELS[category] ?? category

const typeLabel = (type: string) => INCIDENT_TYPE_LABELS[type] ?? type

export function newIncidentNotification(data: NewIncidentData): { subject: string; html: string } {
  const subject = `[${BRAND.shortName} Wohnen] Neuer Vorfall: ${typeLabel(data.type)} (${severityLabel(data.severity)})`

  const html = `
    <div style="${STYLES.warning}">
      <h2 style="${STYLES.alertHeading}">Neuer Vorfall gemeldet</h2>
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
    <div style="${STYLES.panel}">
      <h3 style="${FONT} color: ${EMAIL_COLORS.textBody}; margin: 0 0 8px 0; font-size: 14px;">Beschreibung</h3>
      <p style="${STYLES.paragraph}">${escapeHtml(data.description)}</p>
    </div>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie den Vorfall im ${BRAND.shortName} Wohnen System.</p>
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
  const subject = `Einladung zu ${BRAND.shortName} Wohnen`
  const loginUrl = `${data.appUrl}/login?code=${data.staffCode}`

  const html = `
    <h2 style="${STYLES.header}">Willkommen bei ${BRAND.shortName} Wohnen</h2>
    <p style="${STYLES.paragraph}">
      ${escapeHtml(data.invitedByName)} hat Sie zum ${BRAND.shortName} Wohnen System eingeladen.
    </p>
    <div style="${STYLES.codePanel}">
      <p style="${FONT} color: ${EMAIL_COLORS.info}; font-size: 13px; margin: 0 0 8px 0;">Ihr persönlicher Zugangscode</p>
      <p style="font-family: monospace; font-size: 28px; font-weight: 700; color: ${EMAIL_COLORS.infoStrong}; letter-spacing: 3px; margin: 0 0 16px 0;">${escapeHtml(data.staffCode)}</p>
      <a href="${loginUrl}" style="display: inline-block; background-color: ${EMAIL_COLORS.info}; color: ${EMAIL_COLORS.onAccent}; text-decoration: none; padding: 12px 28px; border-radius: 6px; ${FONT} font-size: 14px; font-weight: 600;">
        Jetzt anmelden
      </a>
    </div>
    <p style="${STYLES.paragraph}">
      Oder öffnen Sie <a href="${data.appUrl}/login" style="color: ${EMAIL_COLORS.info};">${data.appUrl}/login</a> und geben Sie Ihren Code manuell ein.
    </p>
    <p style="${STYLES.paragraph}">
      Bewahren Sie Ihren Code sicher auf — er ist Ihr persönlicher Zugang zum System.
    </p>
    ${emailFooter()}
  `

  return { subject, html }
}

export function newTransferRequestNotification(data: TransferRequestData): { subject: string; html: string } {
  const subject = `[${BRAND.shortName} Wohnen] Neue Verlegungsanfrage: ${data.residentCode}`

  const html = `
    <h2 style="${STYLES.header}">Neue Verlegungsanfrage</h2>
    <p style="${STYLES.paragraph}">
      <strong>Bewohner:</strong> ${escapeHtml(data.residentCode)}<br>
      <strong>Aktuelle Wohneinheit:</strong> ${escapeHtml(data.currentUnitCode)}<br>
      ${data.targetUnitCode ? `<strong>Gewünschte Wohneinheit:</strong> ${escapeHtml(data.targetUnitCode)}<br>` : ''}
      <strong>Grund:</strong> ${escapeHtml(data.reason)}
    </p>
    <p style="${STYLES.paragraph}">Bitte prüfen Sie die Anfrage im ${BRAND.shortName} Wohnen System.</p>
    ${emailFooter()}
  `

  return { subject, html }
}
