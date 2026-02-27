import type { Metadata } from 'next'
import { requireStaffAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { InviteForm } from './InviteForm'
import { EMAIL_CONFIG } from '@/lib/email/config'

export const metadata: Metadata = { title: 'Einstellungen' }

export default async function SettingsPage() {
  await requireStaffAuth()

  const staffUsers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true, email: true, lastLoginAt: true },
    orderBy: { name: 'asc' },
  })

  const emailEnabled = EMAIL_CONFIG.enabled

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">Teamverwaltung und Systemkonfiguration</p>
      </div>

      {/* Invite new staff */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Mitarbeiter einladen</h2>
        <p className="text-sm text-gray-500 mb-4">
          Erstellt einen Zugangscode und sendet eine Einladungs-E-Mail.
        </p>

        {!emailEnabled && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Hinweis:</strong> E-Mail nicht konfiguriert (kein <code className="font-mono">BREVO_API_KEY</code>).
            Der Code wird nach dem Senden angezeigt — bitte manuell übermitteln.
          </div>
        )}

        <InviteForm />
      </div>

      {/* Current team */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Team ({staffUsers.length})
        </h2>

        <div className="space-y-2">
          {staffUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.email || '—'} · <span className="font-mono">{user.code}</span>
                </p>
              </div>
              <div className="text-right">
                {user.lastLoginAt ? (
                  <p className="text-xs text-gray-500">
                    Zuletzt: {new Date(user.lastLoginAt).toLocaleDateString('de-CH')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Noch nie angemeldet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email config status */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">E-Mail-Konfiguration</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${emailEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-700">
              Brevo API: {emailEnabled ? 'Verbunden' : 'Nicht konfiguriert'}
            </span>
          </div>
          {emailEnabled && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-700">
                Absender: {EMAIL_CONFIG.fromName} &lt;{EMAIL_CONFIG.fromAddress}&gt;
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${EMAIL_CONFIG.staffRecipients.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-700">
              Benachrichtigungen:{' '}
              {EMAIL_CONFIG.staffRecipients.length > 0
                ? EMAIL_CONFIG.staffRecipients.join(', ')
                : 'Keine Empfänger konfiguriert'}
            </span>
          </div>
          {!emailEnabled && (
            <p className="text-gray-500 text-xs mt-2">
              Fügen Sie <code className="font-mono bg-gray-100 px-1 rounded">BREVO_API_KEY</code> zur{' '}
              <code className="font-mono bg-gray-100 px-1 rounded">.env</code>-Datei hinzu, um E-Mails zu aktivieren.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
