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
  ROOM_SHARING_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
  RECYCLING_KNOWLEDGE_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
} from '@/lib/constants'

interface ResidentFormFieldsProps {
  defaultValues?: {
    code?: string
    ageRange?: string
    gender?: string
    familyStatus?: string
    sleepSchedule?: string
    noiseTolerance?: number
    cleanlinessLevel?: number
    socialStyle?: string
    languages?: string[]
    culturalRegion?: string | null
    smokingStatus?: string
    dietaryNeeds?: string[]
    mobilityNeeds?: string
    medicalEquipment?: boolean
    petTolerance?: boolean
    sharedBathroom?: boolean
    sharedKitchen?: boolean
    privacyNeed?: number
    // Household fields
    choresContribution?: number
    recyclingKnowledge?: string
    // Health/Support fields
    roomSharingStatus?: string
    hasNightDisturbances?: boolean
    needsQuietEnvironment?: boolean
    hasSleepEquipment?: boolean
    supportLevel?: string
    // Medical documentation
    hasMedicalDocumentation?: boolean
    medicalDocType?: string | null
    medicalDocDate?: Date | null
    medicalDocNotes?: string | null
    notes?: string | null
  }
  isEdit?: boolean
}

export function ResidentFormFields({ defaultValues = {}, isEdit = false }: ResidentFormFieldsProps) {
  return (
    <>
      {/* Basic Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grunddaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Code / Referenz *</label>
            <input
              type="text"
              name="code"
              required
              defaultValue={defaultValues.code}
              placeholder="z.B. R-2024-001"
              className="input"
              readOnly={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">Code kann nicht geändert werden</p>
            )}
          </div>
          <div>
            <label className="label">Altersgruppe *</label>
            <select name="ageRange" required defaultValue={defaultValues.ageRange} className="input">
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
            <select name="gender" required defaultValue={defaultValues.gender} className="input">
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
            <select name="familyStatus" required defaultValue={defaultValues.familyStatus} className="input">
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lebensstil</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Schlafrhythmus *</label>
            <select name="sleepSchedule" required defaultValue={defaultValues.sleepSchedule} className="input">
              <option value="">Bitte wählen</option>
              {Object.entries(SLEEP_SCHEDULE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <ScaleInput
            name="noiseTolerance"
            label="Lärmtoleranz"
            description="Wie empfindlich gegenüber Geräuschen?"
            leftLabel="Sehr empfindlich"
            rightLabel="Sehr tolerant"
            defaultValue={defaultValues.noiseTolerance ?? 3}
          />

          <ScaleInput
            name="cleanlinessLevel"
            label="Sauberkeitsstandard"
            description="Wie wichtig ist Ordnung?"
            leftLabel="Entspannt"
            rightLabel="Sehr ordentlich"
            defaultValue={defaultValues.cleanlinessLevel ?? 3}
          />
        </div>
      </div>

      {/* Social */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Soziales</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Soziale Präferenz *</label>
            <select name="socialStyle" required defaultValue={defaultValues.socialStyle} className="input">
              <option value="">Bitte wählen</option>
              {Object.entries(SOCIAL_STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <ScaleInput
            name="privacyNeed"
            label="Privatsphäre"
            description="Wie viel Rückzugsort wird benötigt?"
            leftLabel="Offen"
            rightLabel="Viel Privatsphäre"
            defaultValue={defaultValues.privacyNeed ?? 3}
          />

          <div>
            <label className="label">Sprachen</label>
            <p className="text-xs text-gray-500 mb-2">Welche Sprachen werden gesprochen?</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <label key={code} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="languages"
                    value={code}
                    defaultChecked={defaultValues.languages?.includes(code)}
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
              defaultValue={defaultValues.culturalRegion || ''}
              placeholder="z.B. Naher Osten, Ostafrika, Balkan"
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">Breite Region, nicht spezifisches Land</p>
          </div>
        </div>
      </div>

      {/* Practical */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Praktisches</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Rauchen *</label>
              <select name="smokingStatus" required defaultValue={defaultValues.smokingStatus} className="input">
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
              <select name="mobilityNeeds" required defaultValue={defaultValues.mobilityNeeds} className="input">
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
                    defaultChecked={defaultValues.dietaryNeeds?.includes(code)}
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
                defaultChecked={defaultValues.petTolerance ?? true}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Haustiere OK</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sharedBathroom"
                value="true"
                defaultChecked={defaultValues.sharedBathroom ?? true}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Geteiltes Bad OK</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sharedKitchen"
                value="true"
                defaultChecked={defaultValues.sharedKitchen ?? true}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Geteilte Küche OK</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="medicalEquipment"
                value="true"
                defaultChecked={defaultValues.medicalEquipment}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Med. Geräte</span>
            </label>
          </div>
        </div>
      </div>

      {/* Household */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Haushalt</h2>
        <p className="text-sm text-gray-500 mb-4">
          Bereitschaft und Kenntnisse für gemeinschaftliches Wohnen
        </p>
        <div className="space-y-4">
          <ScaleInput
            name="choresContribution"
            label="Haushaltsbereitschaft"
            description="Wie bereit ist die Person, sich an Haushaltsaufgaben zu beteiligen?"
            leftLabel="Wenig"
            rightLabel="Sehr engagiert"
            defaultValue={defaultValues.choresContribution ?? 3}
          />

          <div>
            <label className="label">Recycling-Kenntnisse</label>
            <p className="text-xs text-gray-500 mb-2">Kenntnisse über das Schweizer Recyclingsystem</p>
            <select
              name="recyclingKnowledge"
              defaultValue={defaultValues.recyclingKnowledge || 'NONE'}
              className="input"
            >
              {Object.entries(RECYCLING_KNOWLEDGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Health/Support Needs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Unterstützungsbedarf</h2>
        <p className="text-sm text-gray-500 mb-4">
          Funktionale Bedürfnisse für die Unterkunft (keine Diagnosen erforderlich)
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Zimmerteilung *</label>
              <select
                name="roomSharingStatus"
                required
                defaultValue={defaultValues.roomSharingStatus || 'CAN_SHARE'}
                className="input"
              >
                {Object.entries(ROOM_SHARING_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Ob die Person ein Zimmer teilen kann (nicht warum)
              </p>
            </div>
            <div>
              <label className="label">Betreuungsstufe</label>
              <select
                name="supportLevel"
                defaultValue={defaultValues.supportLevel || 'STANDARD'}
                className="input"
              >
                {Object.entries(SUPPORT_LEVEL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasNightDisturbances"
                value="true"
                defaultChecked={defaultValues.hasNightDisturbances}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <div>
                <span className="text-sm text-gray-700">Nächtliche Unruhe</span>
                <p className="text-xs text-gray-400">Alpträume, Schlafwandeln, etc.</p>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="needsQuietEnvironment"
                value="true"
                defaultChecked={defaultValues.needsQuietEnvironment}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <div>
                <span className="text-sm text-gray-700">Ruhige Umgebung nötig</span>
                <p className="text-xs text-gray-400">Benötigt besonders ruhige Umgebung</p>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasSleepEquipment"
                value="true"
                defaultChecked={defaultValues.hasSleepEquipment}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <div>
                <span className="text-sm text-gray-700">Schlafgeräte</span>
                <p className="text-xs text-gray-400">CPAP oder andere Geräte</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Medical Documentation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Medizinische Dokumentation</h2>
        <p className="text-sm text-gray-500 mb-4">
          Berechtigung für Einzelzimmer oder Studio (erfordert ärztliche Bestätigung)
        </p>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hasMedicalDocumentation"
              value="true"
              defaultChecked={defaultValues.hasMedicalDocumentation}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Medizinische Dokumentation vorhanden
              </span>
              <p className="text-xs text-gray-400">
                Ärztliche Bestätigung für besondere Unterbringungsbedürfnisse
              </p>
            </div>
          </label>

          <div className="pl-8 space-y-4 border-l-2 border-gray-200 ml-2">
            <div>
              <label className="label">Art der Berechtigung</label>
              <div className="space-y-2">
                {Object.entries(MEDICAL_DOC_TYPE_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="medicalDocType"
                      value={key}
                      defaultChecked={defaultValues.medicalDocType === key}
                      className="w-4 h-4 border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Datum der Dokumentation</label>
              <input
                type="date"
                name="medicalDocDate"
                defaultValue={
                  defaultValues.medicalDocDate
                    ? new Date(defaultValues.medicalDocDate).toISOString().split('T')[0]
                    : ''
                }
                className="input max-w-xs"
              />
            </div>

            <div>
              <label className="label">Notizen zur Dokumentation</label>
              <textarea
                name="medicalDocNotes"
                rows={2}
                defaultValue={defaultValues.medicalDocNotes || ''}
                placeholder="z.B. Referenznummer, ausstellende Stelle..."
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nur Verwaltungsnotizen, keine medizinischen Details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h2>
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaultValues.notes || ''}
          placeholder="Zusätzliche Informationen für die Platzierung..."
          className="input"
        />
      </div>
    </>
  )
}

// Reusable scale input component
function ScaleInput({
  name,
  label,
  description,
  leftLabel,
  rightLabel,
  defaultValue = 3,
}: {
  name: string
  label: string
  description: string
  leftLabel: string
  rightLabel: string
  defaultValue?: number
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <label key={level} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={level}
              defaultChecked={level === defaultValue}
              className="sr-only peer"
            />
            <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors">
              {level}
            </div>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
