'use client'

import { useState } from 'react'
import { PORTAL_LABELS } from '@/lib/constants/labels'

interface Props {
  roommates: { id: string; code: string }[]
}

type Category = 'MAINTENANCE' | 'INTERPERSONAL'

export function ReportForm({ roommates }: Props) {
  const [category, setCategory] = useState<Category | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [defaults, setDefaults] = useState<{
    type?: string
    severity?: string
    description?: string
    location?: string
  }>({})
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyTemplate = (template: {
    key: string
    category: Category
    type: string
    severity: string
    description: string
    location?: string
  }) => {
    setCategory(template.category)
    setDefaults({
      type: template.type,
      severity: template.severity,
      description: template.description,
      location: template.location,
    })
    setActiveTemplate(template.key)
    setError(null)
    setFormKey((k) => k + 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch('/api/portal/report', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || PORTAL_LABELS.report.errorGeneric)
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : PORTAL_LABELS.report.errorGeneric)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="text-center py-6">
            <span className="text-5xl mb-4 block">✓</span>
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              {PORTAL_LABELS.report.successTitle}
            </h2>
            <p className="text-green-700">
              {PORTAL_LABELS.report.successMessage}
            </p>
          </div>
        </div>

        <div className="card border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-2">Was passiert als Nächstes?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal pl-5">
            <li>Ihr Bericht ist gespeichert und für das Team sichtbar.</li>
            <li>Das Team priorisiert den Fall nach Dringlichkeit.</li>
            <li>Bei Rückfragen oder bei hoher Priorität meldet sich die Betreuung zeitnah.</li>
          </ol>
          <p className="text-xs text-blue-700 mt-3">
            Tipp: Unter &quot;Meine Meldungen&quot; im Dashboard sehen Sie, ob ein Bericht offen oder gelöst ist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Quick templates */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">Schnell melden</h3>
            <p className="text-sm text-gray-500">Typische Fälle mit einem Klick vorbefüllen</p>
          </div>
          {activeTemplate && (
            <button
              type="button"
              onClick={() => { setActiveTemplate(null); setDefaults({}); setFormKey((k) => k + 1) }}
              className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px]"
            >
              Vorlage zurücksetzen
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTemplate({
              key: 'maintenance-urgent',
              category: 'MAINTENANCE',
              type: '',
              severity: 'HIGH',
              location: 'COMMON_AREA',
              description: 'Dringender Defekt: Was ist kaputt, seit wann, und was ist aktuell eingeschränkt?',
            })}
            className={`btn-outline min-h-[44px] ${activeTemplate === 'maintenance-urgent' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🔧 Dringende Reparatur
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              key: 'noise',
              category: 'INTERPERSONAL',
              type: 'NOISE_COMPLAINT',
              severity: 'MEDIUM',
              description: 'Lärmbelastung: Zeitpunkt, Häufigkeit und eigene Versuche zur Klärung kurz dokumentieren.',
            })}
            className={`btn-outline min-h-[44px] ${activeTemplate === 'noise' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🔊 Lärmkonflikt
          </button>
          <button
            type="button"
            onClick={() => applyTemplate({
              key: 'safety',
              category: 'INTERPERSONAL',
              type: 'SAFETY_CONCERN',
              severity: 'HIGH',
              description: 'Sicherheitsbedenken: Risiko, Beteiligte und was sofort benötigt wird klar beschreiben.',
            })}
            className={`btn-outline min-h-[44px] ${activeTemplate === 'safety' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}`}
          >
            🚨 Sicherheit
          </button>
        </div>
      </div>

      <div className="mb-6 p-3 rounded-lg border border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Transparenz</h3>
        <p className="text-xs text-gray-600">
          Nach dem Absenden wird Ihre Meldung als <strong>offen</strong> geführt und später als <strong>gelöst</strong> markiert.
          In dringenden Fällen wird priorisiert reagiert.
        </p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => { setCategory('MAINTENANCE'); setActiveTemplate(null); setDefaults({}); setFormKey((k) => k + 1); setError(null) }}
          className={`card-hover flex items-center gap-4 text-left transition-all ${
            category === 'MAINTENANCE' ? 'ring-2 ring-aoz-primary' : ''
          }`}
        >
          <span className="text-4xl">🔧</span>
          <div>
            <h3 className="font-semibold text-gray-900">{PORTAL_LABELS.report.categoryMaintenance}</h3>
            <p className="text-sm text-gray-500">{PORTAL_LABELS.report.categoryMaintenanceDesc}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => { setCategory('INTERPERSONAL'); setActiveTemplate(null); setDefaults({}); setFormKey((k) => k + 1); setError(null) }}
          className={`card-hover flex items-center gap-4 text-left transition-all ${
            category === 'INTERPERSONAL' ? 'ring-2 ring-aoz-primary' : ''
          }`}
        >
          <span className="text-4xl">💬</span>
          <div>
            <h3 className="font-semibold text-gray-900">{PORTAL_LABELS.report.categoryConflict}</h3>
            <p className="text-sm text-gray-500">{PORTAL_LABELS.report.categoryConflictDesc}</p>
          </div>
        </button>
      </div>

      {/* Dynamic Form */}
      {category && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {category === 'MAINTENANCE' ? PORTAL_LABELS.report.titleMaintenance : PORTAL_LABELS.report.titleConflict}
          </h2>
          {category === 'INTERPERSONAL' && (
            <p className="text-sm text-gray-500 mb-4">
              {PORTAL_LABELS.report.conflictSubtitle}
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="category" value={category} />

            {/* Type Selection */}
            <div>
              <label className="label">
                {category === 'MAINTENANCE' ? PORTAL_LABELS.report.typeLabel : PORTAL_LABELS.report.conflictTypeLabel}
              </label>
              <select name="type" className="input" required defaultValue={defaults.type || ''}>
                <option value="">{PORTAL_LABELS.report.selectPlaceholder}</option>
                {(category === 'MAINTENANCE' ? PORTAL_LABELS.report.maintenanceTypes : PORTAL_LABELS.report.conflictTypes).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Location (maintenance only) */}
            {category === 'MAINTENANCE' && (
              <div>
                <label className="label">{PORTAL_LABELS.report.locationLabel}</label>
                <select name="location" className="input" defaultValue={defaults.location || PORTAL_LABELS.report.locations[0]?.value}>
                  {PORTAL_LABELS.report.locations.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Involved person (conflict only) */}
            {category === 'INTERPERSONAL' && roommates.length > 0 && (
              <div>
                <label className="label">{PORTAL_LABELS.report.involvedLabel}</label>
                <select name="involvedResident" className="input">
                  <option value="">{PORTAL_LABELS.report.involvedPlaceholder}</option>
                  {roommates.map((rm) => (
                    <option key={rm.id} value={rm.id}>{rm.code}</option>
                  ))}
                  <option value="external">{PORTAL_LABELS.report.involvedExternal}</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {PORTAL_LABELS.report.confidentialNote}
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="label">
                {category === 'MAINTENANCE' ? PORTAL_LABELS.report.descriptionLabel : PORTAL_LABELS.report.conflictDescriptionLabel}
              </label>
              <textarea
                name="description"
                className="input"
                defaultValue={defaults.description || ''}
                rows={4}
                placeholder={category === 'MAINTENANCE'
                  ? PORTAL_LABELS.report.descriptionPlaceholder
                  : PORTAL_LABELS.report.conflictDescriptionPlaceholder}
                required
                maxLength={2000}
              />
            </div>

            {/* Incident date (conflict only) */}
            {category === 'INTERPERSONAL' && (
              <div>
                <label className="label">{PORTAL_LABELS.report.dateLabel}</label>
                <input
                  type="date"
                  name="incidentDate"
                  className="input"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Severity */}
            <div>
              <label className="label">
                {category === 'MAINTENANCE' ? PORTAL_LABELS.report.severityLabel : PORTAL_LABELS.report.conflictSeverityLabel}
              </label>
              <div className={`grid gap-2 sm:gap-3 ${
                category === 'MAINTENANCE' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
              }`}>
                {PORTAL_LABELS.report.severityOptions[category].map((sev) => (
                  <label key={sev.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      value={sev.value}
                      defaultChecked={defaults.severity ? sev.value === defaults.severity : sev.value === 'MEDIUM'}
                      className="sr-only peer"
                    />
                    <div className="py-3 px-2 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-blue-50 transition-colors min-h-[70px] flex flex-col items-center justify-center">
                      {'icon' in sev && <span className="text-xl block mb-1">{sev.icon}</span>}
                      <span className={`block ${'desc' in sev ? 'text-sm font-medium' : 'text-xs'}`}>
                        {sev.label}
                      </span>
                      {'desc' in sev && (
                        <span className="text-xs text-gray-500">{sev.desc}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mediation request (conflict only) */}
            {category === 'INTERPERSONAL' && (
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requestMediation"
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                  />
                  <span className="text-sm text-gray-700">
                    {PORTAL_LABELS.report.mediationLabel}
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? PORTAL_LABELS.report.submitting
                : category === 'MAINTENANCE'
                  ? PORTAL_LABELS.report.submitMaintenance
                  : PORTAL_LABELS.report.submitConflict}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
