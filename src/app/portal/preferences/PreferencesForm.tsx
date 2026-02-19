'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PORTAL_LABELS, LANGUAGE_LABELS, DIET_LABELS } from '@/lib/constants/labels'

interface ResidentData {
  sleepSchedule: string
  noiseTolerance: number
  cleanlinessLevel: number
  socialStyle: string
  privacyNeed: number
  smokingStatus: string
  petTolerance: boolean
  sharedBathroom: boolean
  sharedKitchen: boolean
  languages: string[]
  dietaryNeeds: string[]
  roommatePreferences: string | null
}

interface Props {
  resident: ResidentData
  languageOptions: string[]
  dietOptions: string[]
}

function RatingScale({
  name,
  defaultValue,
  lowLabel,
  highLabel,
}: {
  name: string
  defaultValue: number
  lowLabel: string
  highLabel: string
}) {
  return (
    <>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <label key={level} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={level}
              defaultChecked={defaultValue === level}
              className="sr-only peer"
            />
            <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
              {level}
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </>
  )
}

export function PreferencesForm({ resident, languageOptions, dietOptions }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Änderungen verwerfen? Nicht gespeicherte Eingaben gehen verloren.')) {
        router.push('/portal')
      }
    } else {
      router.push('/portal')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch('/api/portal/preferences', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || PORTAL_LABELS.preferences.errorGeneric)
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : PORTAL_LABELS.preferences.errorGeneric)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="text-center py-6">
          <span className="text-5xl mb-4 block">✓</span>
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            {PORTAL_LABELS.preferences.successTitle}
          </h2>
          <p className="text-green-700">
            {PORTAL_LABELS.preferences.successMessage}
          </p>
          <Link href="/portal" className="text-aoz-primary hover:underline mt-4 inline-block">
            {PORTAL_LABELS.form.back}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6 pb-24 sm:pb-0">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            Tipp: Speichern Sie unten, sobald Sie fertig sind. Änderungen sind erst nach dem Speichern aktiv.
          </p>
          {isDirty && (
            <p className="text-xs text-blue-700 mt-1">Nicht gespeicherte Änderungen vorhanden.</p>
          )}
        </div>

        {/* Lifestyle Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lebensstil</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Schlafrhythmus</label>
              <select
                name="sleepSchedule"
                defaultValue={resident.sleepSchedule}
                className="input"
              >
                <option value="EARLY_BIRD">Frühaufsteher (vor 22 Uhr schlafen)</option>
                <option value="STANDARD">Normal (22-24 Uhr schlafen)</option>
                <option value="NIGHT_OWL">Nachteule (nach Mitternacht)</option>
                <option value="IRREGULAR">Unregelmässig (Schichtarbeit etc.)</option>
              </select>
            </div>

            <div>
              <label className="label">Lärmtoleranz</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie empfindlich bist du gegenüber Geräuschen?
              </p>
              <RatingScale
                name="noiseTolerance"
                defaultValue={resident.noiseTolerance}
                lowLabel="Sehr empfindlich"
                highLabel="Sehr tolerant"
              />
            </div>

            <div>
              <label className="label">Sauberkeitsstandard</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie wichtig ist dir Ordnung?
              </p>
              <RatingScale
                name="cleanlinessLevel"
                defaultValue={resident.cleanlinessLevel}
                lowLabel="Entspannt"
                highLabel="Sehr ordentlich"
              />
            </div>
          </div>
        </div>

        {/* Social Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Soziales</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Soziale Präferenz</label>
              <select
                name="socialStyle"
                defaultValue={resident.socialStyle}
                className="input"
              >
                <option value="INTROVERTED">Ruhig - Ich brauche viel Zeit für mich</option>
                <option value="MODERATE">Ausgeglichen - Mal allein, mal mit anderen</option>
                <option value="EXTROVERTED">Gesellig - Ich bin gern unter Menschen</option>
              </select>
            </div>

            <div>
              <label className="label">Privatsphäre</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie viel Rückzugsort brauchst du?
              </p>
              <RatingScale
                name="privacyNeed"
                defaultValue={resident.privacyNeed}
                lowLabel="Offen"
                highLabel="Viel Privatsphäre"
              />
            </div>

            <div>
              <label className="label">Sprachen</label>
              <p className="text-xs text-gray-500 mb-2">
                Welche Sprachen sprichst du?
              </p>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((code) => {
                  const lowerCode = code.toLowerCase()
                  return (
                    <label key={code} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="languages"
                        value={lowerCode}
                        defaultChecked={resident.languages.includes(lowerCode) || resident.languages.includes(code)}
                        className="sr-only peer"
                      />
                      <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                        {LANGUAGE_LABELS[code] || LANGUAGE_LABELS[lowerCode] || code}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Practical Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Praktisches</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Rauchen</label>
              <select
                name="smokingStatus"
                defaultValue={resident.smokingStatus}
                className="input"
              >
                <option value="NON_SMOKER">Nichtraucher</option>
                <option value="OUTDOOR_SMOKER">Raucher (nur draussen)</option>
                <option value="INDOOR_SMOKER">Raucher (auch drinnen)</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="petTolerance"
                  defaultChecked={resident.petTolerance}
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Haustiere OK</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="sharedBathroom"
                  defaultChecked={resident.sharedBathroom}
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Geteiltes Bad OK</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="sharedKitchen"
                  defaultChecked={resident.sharedKitchen}
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Geteilte Küche OK</span>
              </label>
            </div>

            <div>
              <label className="label">Ernährung</label>
              <div className="flex flex-wrap gap-2">
                {dietOptions.map((opt) => {
                  const lowerOpt = opt.toLowerCase()
                  return (
                    <label key={opt} className="cursor-pointer">
                      <input
                        type="checkbox"
                        name="dietaryNeeds"
                        value={lowerOpt}
                        defaultChecked={resident.dietaryNeeds.includes(lowerOpt) || resident.dietaryNeeds.includes(opt)}
                        className="sr-only peer"
                      />
                      <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                        {DIET_LABELS[opt] || DIET_LABELS[lowerOpt] || opt}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Roommate Preferences */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mitbewohner-Präferenzen</h2>
          <p className="text-sm text-gray-500 mb-4">
            Optional: Hast du besondere Wünsche für deine Mitbewohner?
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Bevorzugte Altersgruppe</label>
              <select name="preferredAgeRange" className="input">
                <option value="">Keine Präferenz</option>
                <option value="SIMILAR">Ähnliches Alter wie ich</option>
                <option value="YOUNG_ADULT">Jüngere (18-25)</option>
                <option value="ADULT">Erwachsene (26-40)</option>
                <option value="MIDDLE_AGED">Mittleres Alter (41-55)</option>
                <option value="SENIOR">Ältere (56+)</option>
              </select>
            </div>

            <div>
              <label className="label">Kulturelle Präferenz</label>
              <select name="culturalPreference" className="input">
                <option value="">Keine Präferenz</option>
                <option value="SAME_REGION">Aus meiner Region</option>
                <option value="DIFFERENT_REGION">Aus anderen Regionen (zum Kennenlernen)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Dies ist nur eine Präferenz, keine Garantie
              </p>
            </div>

            <div>
              <label className="label">Zusätzliche Wünsche</label>
              <textarea
                name="additionalPreferences"
                className="input"
                rows={3}
                placeholder="z.B. 'Ich arbeite Nachtschicht', 'Ich habe Allergien gegen Katzen'..."
                maxLength={1000}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full sm:w-auto min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? PORTAL_LABELS.preferences.saving : PORTAL_LABELS.preferences.saveButton}
          </button>
          <button type="button" onClick={handleCancel} className="btn-outline w-full sm:w-auto min-h-[44px]">
            {PORTAL_LABELS.form.cancel}
          </button>
        </div>
      </form>

      {/* Privacy Notice */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">{PORTAL_LABELS.preferences.privacyTitle}</h3>
        <p className="text-sm text-gray-600">
          {PORTAL_LABELS.preferences.privacyMessage}
        </p>
      </div>
    </>
  )
}
