import type { Metadata } from 'next'
import { requireStaffAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { InviteForm } from './InviteForm'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { SETTINGS_LABELS, PILOT_BASELINE_LABELS } from '@/lib/constants'
import { getSystemConfig, saveSystemConfig } from '@/lib/actions/config'
import { SubmitButton } from '@/components/ui'

export const metadata: Metadata = { title: 'Einstellungen' }

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  await requireStaffAuth()

  const [staffUsers, systemConfig] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, email: true, lastLoginAt: true },
      orderBy: { name: 'asc' },
    }),
    getSystemConfig(),
  ])

  const emailEnabled = EMAIL_CONFIG.enabled

  const pilotStartValue = systemConfig.pilotStartDate
    ? new Date(systemConfig.pilotStartDate).toISOString().split('T')[0]
    : ''

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{SETTINGS_LABELS.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{SETTINGS_LABELS.subtitle}</p>
      </div>

      {/* Invite new staff */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{SETTINGS_LABELS.inviteTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {SETTINGS_LABELS.inviteSubtitle}
        </p>

        {!emailEnabled && (
          <div className="mb-4 p-3 bg-status-warning/10 border border-status-warning/25 rounded-lg text-sm text-status-warning-text">
            {SETTINGS_LABELS.emailWarning}
          </div>
        )}

        <InviteForm />
      </div>

      {/* Current team */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {SETTINGS_LABELS.teamTitle} ({staffUsers.length})
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
                    {SETTINGS_LABELS.lastSeen} {new Date(user.lastLoginAt).toLocaleDateString('de-CH')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">{SETTINGS_LABELS.neverLoggedIn}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pilot Baseline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{PILOT_BASELINE_LABELS.sectionTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">{PILOT_BASELINE_LABELS.sectionDesc}</p>

        <form action={saveSystemConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">{PILOT_BASELINE_LABELS.startDateLabel}</label>
              <input
                type="date"
                name="pilotStartDate"
                defaultValue={pilotStartValue}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">{PILOT_BASELINE_LABELS.startDateHint}</p>
            </div>
            <div>
              <label className="label">{PILOT_BASELINE_LABELS.incidentsLabel}</label>
              <input
                type="number"
                name="pilotBaselineIncidentsPerMonth"
                min="0"
                step="0.1"
                defaultValue={systemConfig.pilotBaselineIncidentsPerMonth ?? ''}
                placeholder="z.B. 15"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">{PILOT_BASELINE_LABELS.incidentsHint}</p>
            </div>
            <div>
              <label className="label">{PILOT_BASELINE_LABELS.relocationsLabel}</label>
              <input
                type="number"
                name="pilotBaselineRelocationsPerMonth"
                min="0"
                step="0.1"
                defaultValue={systemConfig.pilotBaselineRelocationsPerMonth ?? ''}
                placeholder="z.B. 4"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">{PILOT_BASELINE_LABELS.relocationsHint}</p>
            </div>
            <div>
              <label className="label">{PILOT_BASELINE_LABELS.mediationHoursLabel}</label>
              <input
                type="number"
                name="pilotBaselineMediationHoursPerWeek"
                min="0"
                step="0.5"
                defaultValue={systemConfig.pilotBaselineMediationHoursPerWeek ?? ''}
                placeholder="z.B. 12"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">{PILOT_BASELINE_LABELS.mediationHoursHint}</p>
            </div>
          </div>
          <div>
            <SubmitButton className="btn-primary min-h-[44px] disabled:opacity-60 disabled:cursor-wait">
              {PILOT_BASELINE_LABELS.saveButton}
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* Email config status */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{SETTINGS_LABELS.emailConfigTitle}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${emailEnabled ? 'bg-status-success' : 'bg-gray-300'}`} />
            <span className="text-gray-700">
              {emailEnabled ? SETTINGS_LABELS.brevoConnected : SETTINGS_LABELS.brevoNotConfigured}
            </span>
          </div>
          {emailEnabled && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              <span className="text-gray-700">
                {SETTINGS_LABELS.senderPrefix} {EMAIL_CONFIG.fromName} &lt;{EMAIL_CONFIG.fromAddress}&gt;
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${EMAIL_CONFIG.staffRecipients.length > 0 ? 'bg-status-success' : 'bg-gray-300'}`} />
            <span className="text-gray-700">
              {SETTINGS_LABELS.notificationsPrefix}{' '}
              {EMAIL_CONFIG.staffRecipients.length > 0
                ? EMAIL_CONFIG.staffRecipients.join(', ')
                : SETTINGS_LABELS.noRecipients}
            </span>
          </div>
          {!emailEnabled && (
            <p className="text-gray-500 text-xs mt-2">
              {SETTINGS_LABELS.addBrevoHint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
