import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PreferencesPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    redirect('/portal')
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Deine Einstellungen</h1>
        <p className="text-gray-500">
          Diese Angaben helfen uns, passende Mitbewohner zu finden
        </p>
      </div>

      <form action="/api/portal/preferences" method="POST" className="space-y-6">
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
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label
                    key={level}
                    className="flex-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="noiseTolerance"
                      value={level}
                      defaultChecked={resident.noiseTolerance === level}
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
                Wie wichtig ist dir Ordnung?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label
                    key={level}
                    className="flex-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="cleanlinessLevel"
                      value={level}
                      defaultChecked={resident.cleanlinessLevel === level}
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
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <label
                    key={level}
                    className="flex-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="privacyNeed"
                      value={level}
                      defaultChecked={resident.privacyNeed === level}
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
                Welche Sprachen sprichst du?
              </p>
              <div className="flex flex-wrap gap-2">
                {['de', 'en', 'fr', 'it', 'ar', 'tr', 'uk', 'ru', 'fa', 'ti'].map((lang) => (
                  <label
                    key={lang}
                    className="cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={lang}
                      defaultChecked={resident.languages.includes(lang)}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                      {getLanguageLabel(lang)}
                    </div>
                  </label>
                ))}
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
                {['halal', 'kosher', 'vegetarian', 'vegan'].map((diet) => (
                  <label
                    key={diet}
                    className="cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="dietaryNeeds"
                      value={diet}
                      defaultChecked={resident.dietaryNeeds.includes(diet)}
                      className="sr-only peer"
                    />
                    <div className="px-4 py-2 rounded-full border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors text-sm">
                      {getDietLabel(diet)}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roommate Preferences - NEW */}
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
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Einstellungen speichern
          </button>
          <Link href="/portal" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>

      {/* Privacy Notice */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Datenschutz</h3>
        <p className="text-sm text-gray-600">
          Deine Angaben werden nur verwendet, um passende Mitbewohner zu finden.
          Sie werden nicht an Dritte weitergegeben. Du kannst deine Daten jederzeit
          ändern oder löschen lassen.
        </p>
      </div>
    </div>
  )
}

function getLanguageLabel(code: string): string {
  const labels: Record<string, string> = {
    de: 'Deutsch',
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    ar: 'العربية',
    tr: 'Türkçe',
    uk: 'Українська',
    ru: 'Русский',
    fa: 'فارسی',
    ti: 'ትግርኛ',
  }
  return labels[code] || code
}

function getDietLabel(diet: string): string {
  const labels: Record<string, string> = {
    halal: 'Halal',
    kosher: 'Koscher',
    vegetarian: 'Vegetarisch',
    vegan: 'Vegan',
  }
  return labels[diet] || diet
}
