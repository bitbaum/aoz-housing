'use client'

import { useState } from 'react'

const MAINTENANCE_TYPES = [
  { value: 'PLUMBING', label: 'Sanitär (WC, Dusche, Wasserhahn)' },
  { value: 'ELECTRICAL', label: 'Elektrik (Licht, Steckdosen)' },
  { value: 'HEATING_COOLING', label: 'Heizung / Klima' },
  { value: 'APPLIANCE', label: 'Gerät defekt (Kühlschrank, Herd etc.)' },
  { value: 'STRUCTURAL', label: 'Bauschaden (Fenster, Türen, Boden)' },
  { value: 'PEST_CONTROL', label: 'Schädlinge' },
  { value: 'SECURITY_SYSTEM', label: 'Sicherheit (Schloss, Tür)' },
  { value: 'GENERAL_MAINTENANCE', label: 'Sonstiges' },
]

const CONFLICT_TYPES = [
  { value: 'NOISE_COMPLAINT', label: 'Lärm' },
  { value: 'CLEANLINESS_DISPUTE', label: 'Sauberkeit' },
  { value: 'SPACE_DISPUTE', label: 'Platz / Nutzung gemeinsamer Räume' },
  { value: 'SCHEDULE_CONFLICT', label: 'Zeitliche Konflikte (Bad, Küche)' },
  { value: 'PERSONAL_CONFLICT', label: 'Persönlicher Konflikt' },
  { value: 'CULTURAL_FRICTION', label: 'Kulturelle Missverständnisse' },
  { value: 'SAFETY_CONCERN', label: 'Sicherheitsbedenken' },
  { value: 'OTHER', label: 'Sonstiges' },
]

const LOCATIONS = [
  { value: 'room', label: 'Mein Zimmer' },
  { value: 'bathroom', label: 'Badezimmer' },
  { value: 'kitchen', label: 'Küche' },
  { value: 'common', label: 'Gemeinschaftsraum' },
  { value: 'entrance', label: 'Eingang / Flur' },
  { value: 'other', label: 'Anderer Ort' },
]

const SEVERITY_OPTIONS = {
  MAINTENANCE: [
    { value: 'LOW', label: 'Kann warten', icon: '🟢' },
    { value: 'MEDIUM', label: 'Bald beheben', icon: '🟡' },
    { value: 'HIGH', label: 'Dringend', icon: '🟠' },
    { value: 'CRITICAL', label: 'Notfall', icon: '🔴' },
  ],
  INTERPERSONAL: [
    { value: 'LOW', label: 'Störend', desc: 'Aber ich komme zurecht' },
    { value: 'MEDIUM', label: 'Belastend', desc: 'Beeinträchtigt meinen Alltag' },
    { value: 'HIGH', label: 'Sehr belastend', desc: 'Brauche Unterstützung' },
    { value: 'CRITICAL', label: 'Unerträglich', desc: 'Dringende Hilfe nötig' },
  ],
}

interface Props {
  residentId: string
  housingUnitId: string
  roommates: { id: string; code: string }[]
}

type Category = 'MAINTENANCE' | 'INTERPERSONAL'

export function ReportForm({ residentId, housingUnitId, roommates }: Props) {
  const [category, setCategory] = useState<Category | null>(null)

  return (
    <div>
      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setCategory('MAINTENANCE')}
          className={`card-hover flex items-center gap-4 text-left transition-all ${
            category === 'MAINTENANCE' ? 'ring-2 ring-aoz-primary' : ''
          }`}
        >
          <span className="text-4xl">🔧</span>
          <div>
            <h3 className="font-semibold text-gray-900">Technisches Problem</h3>
            <p className="text-sm text-gray-500">Defekte Geräte, Wasserschäden, Heizung etc.</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setCategory('INTERPERSONAL')}
          className={`card-hover flex items-center gap-4 text-left transition-all ${
            category === 'INTERPERSONAL' ? 'ring-2 ring-aoz-primary' : ''
          }`}
        >
          <span className="text-4xl">💬</span>
          <div>
            <h3 className="font-semibold text-gray-900">Konflikt melden</h3>
            <p className="text-sm text-gray-500">Probleme mit Mitbewohnern oder Nachbarn</p>
          </div>
        </button>
      </div>

      {/* Dynamic Form */}
      {category && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {category === 'MAINTENANCE' ? '🔧 Technisches Problem melden' : '💬 Konflikt melden'}
          </h2>
          {category === 'INTERPERSONAL' && (
            <p className="text-sm text-gray-500 mb-4">
              Bei Problemen mit Mitbewohnern. Deine Meldung wird vertraulich behandelt.
            </p>
          )}

          <form action="/api/portal/report" method="POST" className="space-y-4">
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="housingUnitId" value={housingUnitId} />
            <input type="hidden" name="residentId" value={residentId} />

            {/* Type Selection */}
            <div>
              <label className="label">
                {category === 'MAINTENANCE' ? 'Art des Problems' : 'Art des Konflikts'}
              </label>
              <select name="type" className="input" required>
                <option value="">Bitte auswählen...</option>
                {(category === 'MAINTENANCE' ? MAINTENANCE_TYPES : CONFLICT_TYPES).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Location (maintenance only) */}
            {category === 'MAINTENANCE' && (
              <div>
                <label className="label">Wo ist das Problem?</label>
                <select name="location" className="input">
                  {LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Involved person (conflict only) */}
            {category === 'INTERPERSONAL' && roommates.length > 0 && (
              <div>
                <label className="label">Betrifft (optional)</label>
                <select name="involvedResident" className="input">
                  <option value="">Möchte ich nicht sagen</option>
                  {roommates.map((rm) => (
                    <option key={rm.id} value={rm.id}>{rm.code}</option>
                  ))}
                  <option value="external">Jemand von ausserhalb</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Diese Information bleibt vertraulich
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="label">
                {category === 'MAINTENANCE' ? 'Beschreibung' : 'Was ist passiert?'}
              </label>
              <textarea
                name="description"
                className="input"
                rows={4}
                placeholder={category === 'MAINTENANCE'
                  ? 'Beschreibe das Problem möglichst genau...'
                  : 'Beschreibe die Situation...'}
                required
              />
            </div>

            {/* Incident date (conflict only) */}
            {category === 'INTERPERSONAL' && (
              <div>
                <label className="label">Wann ist es passiert?</label>
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
                {category === 'MAINTENANCE' ? 'Dringlichkeit' : 'Wie schwer wiegt es für dich?'}
              </label>
              <div className={`grid gap-2 sm:gap-3 ${
                category === 'MAINTENANCE' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
              }`}>
                {SEVERITY_OPTIONS[category].map((sev) => (
                  <label key={sev.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      value={sev.value}
                      defaultChecked={sev.value === 'MEDIUM'}
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
                    Ich wünsche ein Vermittlungsgespräch mit der Hausverwaltung
                  </span>
                </label>
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              {category === 'MAINTENANCE' ? 'Problem melden' : 'Konflikt melden'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
