import type { Metadata } from 'next'
import { requireStaffAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { InviteForm } from './InviteForm'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { SETTINGS_LABELS, PILOT_BASELINE_LABELS } from '@/lib/constants'
import { getSystemConfig, saveSystemConfig } from '@/lib/actions/config'
import { SubmitButton } from '@/components/ui'
import { PageHeader } from '@/components/ui/Page'
import { formatDate, formatDateISO } from '@/lib/utils'

export const metadata: Metadata = { title: 'Einstellungen' }

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  await requireStaffAuth()

  const [staffUsers, systemConfig] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
        lastLoginAt: true,
        account: { select: { email: true } },
      },
      orderBy: { name: 'asc' },
    }),
    getSystemConfig(),
  ])

  const emailEnabled = EMAIL_CONFIG.enabled

  const pilotStartValue = systemConfig.pilotStartDate
    ? formatDateISO(systemConfig.pilotStartDate)
    : ''

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={SETTINGS_LABELS.title} description={SETTINGS_LABELS.subtitle} />

      {/* Invite new staff */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-1">{SETTINGS_LABELS.inviteTitle}</h2>
        <p className="text-sm text-ui-muted mb-4">
          {SETTINGS_LABELS.inviteSubtitle}
        </p>

        {!emailEnabled && (
          <div className="mb-4 alert-warning" role="alert" aria-live="polite">
            {SETTINGS_LABELS.emailWarning}
          </div>
        )}

        <InviteForm />
      </div>

      {/* Current team */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {SETTINGS_LABELS.teamTitle} ({staffUsers.length})
        </h2>

        <div className="space-y-2">
          {staffUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 border-b border-ui-border last:border-0"
            >
              <div>
                <p className="font-medium text-ui-text text-sm">{user.name}</p>
                <p className="text-xs text-ui-muted">
                  {user.account?.email || '—'} · <span className="font-mono">{user.code}</span>
                </p>
              </div>
              <div className="text-right">
                {user.lastLoginAt ? (
                  <p className="text-xs text-ui-muted">
                    {SETTINGS_LABELS.lastSeen} {formatDate(user.lastLoginAt)}
                  </p>
                ) : (
                  <p className="text-xs text-ui-muted">{SETTINGS_LABELS.neverLoggedIn}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pilot Baseline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-1">{PILOT_BASELINE_LABELS.sectionTitle}</h2>
        <p className="text-sm text-ui-muted mb-4">{PILOT_BASELINE_LABELS.sectionDesc}</p>

        <form action={saveSystemConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pilotStartDate">{PILOT_BASELINE_LABELS.startDateLabel}</label>
              <input
                type="date"
                id="pilotStartDate"
                name="pilotStartDate"
                defaultValue={pilotStartValue}
                className="input"
              />
              <p className="text-xs text-ui-muted mt-1">{PILOT_BASELINE_LABELS.startDateHint}</p>
            </div>
            <div>
              <label className="label" htmlFor="pilotBaselineIncidentsPerMonth">{PILOT_BASELINE_LABELS.incidentsLabel}</label>
              <input
                type="number"
                inputMode="numeric"
                id="pilotBaselineIncidentsPerMonth"
                name="pilotBaselineIncidentsPerMonth"
                min="0"
                step="0.1"
                defaultValue={systemConfig.pilotBaselineIncidentsPerMonth ?? ''}
                placeholder="z.B. 15"
                className="input"
              />
              <p className="text-xs text-ui-muted mt-1">{PILOT_BASELINE_LABELS.incidentsHint}</p>
            </div>
            <div>
              <label className="label" htmlFor="pilotBaselineRelocationsPerMonth">{PILOT_BASELINE_LABELS.relocationsLabel}</label>
              <input
                type="number"
                inputMode="numeric"
                id="pilotBaselineRelocationsPerMonth"
                name="pilotBaselineRelocationsPerMonth"
                min="0"
                step="0.1"
                defaultValue={systemConfig.pilotBaselineRelocationsPerMonth ?? ''}
                placeholder="z.B. 4"
                className="input"
              />
              <p className="text-xs text-ui-muted mt-1">{PILOT_BASELINE_LABELS.relocationsHint}</p>
            </div>
            <div>
              <label className="label" htmlFor="pilotBaselineMediationHoursPerWeek">{PILOT_BASELINE_LABELS.mediationHoursLabel}</label>
              <input
                type="number"
                inputMode="numeric"
                id="pilotBaselineMediationHoursPerWeek"
                name="pilotBaselineMediationHoursPerWeek"
                min="0"
                step="0.5"
                defaultValue={systemConfig.pilotBaselineMediationHoursPerWeek ?? ''}
                placeholder="z.B. 12"
                className="input"
              />
              <p className="text-xs text-ui-muted mt-1">{PILOT_BASELINE_LABELS.mediationHoursHint}</p>
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
        <h2 className="text-lg font-semibold text-ui-text mb-4">{SETTINGS_LABELS.emailConfigTitle}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${emailEnabled ? 'bg-status-success' : 'bg-ui-border-strong'}`} />
            <span className="text-ui-muted">
              {emailEnabled ? SETTINGS_LABELS.brevoConnected : SETTINGS_LABELS.brevoNotConfigured}
            </span>
          </div>
          {emailEnabled && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              <span className="text-ui-muted">
                {SETTINGS_LABELS.senderPrefix} {EMAIL_CONFIG.fromName} &lt;{EMAIL_CONFIG.fromAddress}&gt;
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${EMAIL_CONFIG.staffRecipients.length > 0 ? 'bg-status-success' : 'bg-ui-border-strong'}`} />
            <span className="text-ui-muted">
              {SETTINGS_LABELS.notificationsPrefix}{' '}
              {EMAIL_CONFIG.staffRecipients.length > 0
                ? EMAIL_CONFIG.staffRecipients.join(', ')
                : SETTINGS_LABELS.noRecipients}
            </span>
          </div>
          {!emailEnabled && (
            <p className="text-ui-muted text-xs mt-2">
              {SETTINGS_LABELS.addBrevoHint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
