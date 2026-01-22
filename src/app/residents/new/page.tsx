import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  FAMILY_STATUS_LABELS,
  SLEEP_SCHEDULE_LABELS,
  SOCIAL_STYLE_LABELS,
  SMOKING_STATUS_LABELS,
  MOBILITY_NEED_LABELS,
  LANGUAGE_LABELS,
  DIET_LABELS,
} from '@/lib/constants'

export const dynamic = 'force-dynamic'

async function createResident(formData: FormData) {
  'use server'

  const code = formData.get('code') as string
  const ageRange = formData.get('ageRange') as string
  const gender = formData.get('gender') as string
  const familyStatus = formData.get('familyStatus') as string
  const sleepSchedule = formData.get('sleepSchedule') as string
  const noiseTolerance = parseInt(formData.get('noiseTolerance') as string) || 3
  const cleanlinessLevel = parseInt(formData.get('cleanlinessLevel') as string) || 3
  const socialStyle = formData.get('socialStyle') as string
  const languages = formData.getAll('languages') as string[]
  const culturalRegion = formData.get('culturalRegion') as string
  const smokingStatus = formData.get('smokingStatus') as string
  const dietaryNeeds = formData.getAll('dietaryNeeds') as string[]
  const mobilityNeeds = formData.get('mobilityNeeds') as string
  const medicalEquipment = formData.get('medicalEquipment') === 'true'
  const petTolerance = formData.get('petTolerance') === 'true'
  const sharedBathroom = formData.get('sharedBathroom') === 'true'
  const sharedKitchen = formData.get('sharedKitchen') === 'true'
  const privacyNeed = parseInt(formData.get('privacyNeed') as string) || 3
  const notes = formData.get('notes') as string

  const resident = await prisma.resident.create({
    data: {
      code,
      ageRange: ageRange as any,
      gender: gender as any,
      familyStatus: familyStatus as any,
      sleepSchedule: sleepSchedule as any,
      noiseTolerance,
      cleanlinessLevel,
      socialStyle: socialStyle as any,
      languages,
      culturalRegion: culturalRegion || null,
      smokingStatus: smokingStatus as any,
      dietaryNeeds,
      mobilityNeeds: mobilityNeeds as any,
      medicalEquipment,
      petTolerance,
      sharedBathroom,
      sharedKitchen,
      privacyNeed,
      notes: notes || null,
      status: 'ACTIVE',
    },
  })

  redirect(`/residents/${resident.id}`)
}

export default function NewResidentPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/residents"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Neuer Bewohner
        </h1>
        <p className="text-gray-500">
          Erfassen Sie die Informationen für die Kompatibilitätsanalyse
        </p>
      </div>

      <form action={createResident} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Grunddaten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Code / Referenz *</label>
              <input
                type="text"
                name="code"
                required
                placeholder="z.B. R-2024-001"
                className="input"
              />
            </div>
            <div>
              <label className="label">Altersgruppe *</label>
              <select name="ageRange" required className="input">
                <option value="">Bitte wählen</option>
                {Object.entries(AGE_RANGE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Geschlecht *</label>
              <select name="gender" required className="input">
                <option value="">Bitte wählen</option>
                {Object.entries(GENDER_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Familienstatus *</label>
              <select name="familyStatus" required className="input">
                <option value="">Bitte wählen</option>
                {Object.entries(FAMILY_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lebensstil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Schlafrhythmus *</label>
              <select name="sleepSchedule" required className="input">
                <option value="">Bitte wählen</option>
                {Object.entries(SLEEP_SCHEDULE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Lärmtoleranz</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie empfindlich gegenüber Geräuschen?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label key={level} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="noiseTolerance"
                      value={level}
                      defaultChecked={level === 3}
                      className="sr-only peer"
                    />
                    <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
                      {level}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Sehr empfindlich</span>
                <span>Sehr tolerant</span>
              </div>
            </div>

            <div>
              <label className="label">Sauberkeitsstandard</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie wichtig ist Ordnung?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label key={level} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="cleanlinessLevel"
                      value={level}
                      defaultChecked={level === 3}
                      className="sr-only peer"
                    />
                    <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
                      {level}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Entspannt</span>
                <span>Sehr ordentlich</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Soziales</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Soziale Präferenz *</label>
              <select name="socialStyle" required className="input">
                <option value="">Bitte wählen</option>
                {Object.entries(SOCIAL_STYLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Privatsphäre</label>
              <p className="text-xs text-gray-500 mb-2">
                Wie viel Rückzugsort wird benötigt?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label key={level} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="privacyNeed"
                      value={level}
                      defaultChecked={level === 3}
                      className="sr-only peer"
                    />
                    <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
                      {level}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Offen</span>
                <span>Viel Privatsphäre</span>
              </div>
            </div>

            <div>
              <label className="label">Sprachen</label>
              <p className="text-xs text-gray-500 mb-2">
                Welche Sprachen werden gesprochen?
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                  <label key={code} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="languages"
                      value={code}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Kulturelle Region</label>
              <input
                type="text"
                name="culturalRegion"
                placeholder="z.B. Naher Osten, Ostafrika, Balkan"
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">
                Breite Region, nicht spezifisches Land
              </p>
            </div>
          </div>
        </div>

        {/* Practical */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Praktisches
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Rauchen *</label>
                <select name="smokingStatus" required className="input">
                  <option value="">Bitte wählen</option>
                  {Object.entries(SMOKING_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mobilitätsbedarf *</label>
                <select name="mobilityNeeds" required className="input">
                  <option value="">Bitte wählen</option>
                  {Object.entries(MOBILITY_NEED_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Ernährung</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DIET_LABELS).map(([code, label]) => (
                  <label key={code} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="dietaryNeeds"
                      value={code}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="petTolerance"
                  value="true"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Haustiere OK</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="sharedBathroom"
                  value="true"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Geteiltes Bad OK</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="sharedKitchen"
                  value="true"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Geteilte Küche OK</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="medicalEquipment"
                  value="true"
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Med. Geräte</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h2>
          <textarea
            name="notes"
            rows={4}
            placeholder="Zusätzliche Informationen für die Platzierung..."
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Bewohner erfassen
          </button>
          <Link href="/residents" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
