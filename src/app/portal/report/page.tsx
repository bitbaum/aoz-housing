import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          housingUnit: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: { resident: true },
              },
            },
          },
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal')
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident) || []

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Problem melden</h1>
        <p className="text-gray-500">
          Melde technische Probleme oder Konflikte
        </p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <CategoryCard
          icon="🔧"
          title="Technisches Problem"
          description="Defekte Geräte, Wasserschäden, Heizung etc."
          href="#maintenance"
        />
        <CategoryCard
          icon="💬"
          title="Konflikt melden"
          description="Probleme mit Mitbewohnern oder Nachbarn"
          href="#conflict"
        />
      </div>

      {/* Maintenance Report Form */}
      <div id="maintenance" className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔧 Technisches Problem melden
        </h2>

        <form action="/api/portal/report" method="POST" className="space-y-4">
          <input type="hidden" name="category" value="MAINTENANCE" />
          <input type="hidden" name="housingUnitId" value={housingUnit?.id || ''} />
          <input type="hidden" name="residentId" value={resident.id} />

          <div>
            <label className="label">Art des Problems</label>
            <select name="type" className="input" required>
              <option value="">Bitte auswählen...</option>
              <option value="PLUMBING">Sanitär (WC, Dusche, Wasserhahn)</option>
              <option value="ELECTRICAL">Elektrik (Licht, Steckdosen)</option>
              <option value="HEATING_COOLING">Heizung / Klima</option>
              <option value="APPLIANCE">Gerät defekt (Kühlschrank, Herd etc.)</option>
              <option value="STRUCTURAL">Bauschaden (Fenster, Türen, Boden)</option>
              <option value="PEST_CONTROL">Schädlinge</option>
              <option value="SECURITY_SYSTEM">Sicherheit (Schloss, Tür)</option>
              <option value="GENERAL_MAINTENANCE">Sonstiges</option>
            </select>
          </div>

          <div>
            <label className="label">Wo ist das Problem?</label>
            <select name="location" className="input">
              <option value="room">Mein Zimmer</option>
              <option value="bathroom">Badezimmer</option>
              <option value="kitchen">Küche</option>
              <option value="common">Gemeinschaftsraum</option>
              <option value="entrance">Eingang / Flur</option>
              <option value="other">Anderer Ort</option>
            </select>
          </div>

          <div>
            <label className="label">Beschreibung</label>
            <textarea
              name="description"
              className="input"
              rows={4}
              placeholder="Beschreibe das Problem möglichst genau..."
              required
            />
          </div>

          <div>
            <label className="label">Dringlichkeit</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { value: 'LOW', label: 'Kann warten', icon: '🟢' },
                { value: 'MEDIUM', label: 'Bald beheben', icon: '🟡' },
                { value: 'HIGH', label: 'Dringend', icon: '🟠' },
                { value: 'CRITICAL', label: 'Notfall', icon: '🔴' },
              ].map((sev) => (
                <label key={sev.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={sev.value}
                    defaultChecked={sev.value === 'MEDIUM'}
                    className="sr-only peer"
                  />
                  <div className="py-3 px-2 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-blue-50 transition-colors min-h-[70px] flex flex-col items-center justify-center">
                    <span className="text-xl block mb-1">{sev.icon}</span>
                    <span className="text-xs">{sev.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Problem melden
          </button>
        </form>
      </div>

      {/* Conflict Report Form */}
      <div id="conflict" className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          💬 Konflikt melden
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Bei Problemen mit Mitbewohnern. Deine Meldung wird vertraulich behandelt.
        </p>

        <form action="/api/portal/report" method="POST" className="space-y-4">
          <input type="hidden" name="category" value="INTERPERSONAL" />
          <input type="hidden" name="housingUnitId" value={housingUnit?.id || ''} />
          <input type="hidden" name="residentId" value={resident.id} />

          <div>
            <label className="label">Art des Konflikts</label>
            <select name="type" className="input" required>
              <option value="">Bitte auswählen...</option>
              <option value="NOISE_COMPLAINT">Lärm</option>
              <option value="CLEANLINESS_DISPUTE">Sauberkeit</option>
              <option value="SPACE_DISPUTE">Platz / Nutzung gemeinsamer Räume</option>
              <option value="SCHEDULE_CONFLICT">Zeitliche Konflikte (Bad, Küche)</option>
              <option value="PERSONAL_CONFLICT">Persönlicher Konflikt</option>
              <option value="CULTURAL_FRICTION">Kulturelle Missverständnisse</option>
              <option value="SAFETY_CONCERN">Sicherheitsbedenken</option>
              <option value="OTHER">Sonstiges</option>
            </select>
          </div>

          {roommates.length > 0 && (
            <div>
              <label className="label">Betrifft (optional)</label>
              <select name="involvedResident" className="input">
                <option value="">Möchte ich nicht sagen</option>
                {roommates.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.code}
                  </option>
                ))}
                <option value="external">Jemand von ausserhalb</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Diese Information bleibt vertraulich
              </p>
            </div>
          )}

          <div>
            <label className="label">Was ist passiert?</label>
            <textarea
              name="description"
              className="input"
              rows={4}
              placeholder="Beschreibe die Situation..."
              required
            />
          </div>

          <div>
            <label className="label">Wann ist es passiert?</label>
            <input
              type="date"
              name="incidentDate"
              className="input"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="label">Wie schwer wiegt es für dich?</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { value: 'LOW', label: 'Störend', desc: 'Aber ich komme zurecht' },
                { value: 'MEDIUM', label: 'Belastend', desc: 'Beeinträchtigt meinen Alltag' },
                { value: 'HIGH', label: 'Sehr belastend', desc: 'Brauche Unterstützung' },
                { value: 'CRITICAL', label: 'Unerträglich', desc: 'Dringende Hilfe nötig' },
              ].map((sev) => (
                <label key={sev.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={sev.value}
                    defaultChecked={sev.value === 'MEDIUM'}
                    className="sr-only peer"
                  />
                  <div className="py-3 px-2 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-blue-50 transition-colors min-h-[70px] flex flex-col items-center justify-center">
                    <span className="text-sm font-medium block">{sev.label}</span>
                    <span className="text-xs text-gray-500">{sev.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

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

          <button type="submit" className="btn-primary w-full">
            Konflikt melden
          </button>
        </form>
      </div>

      {/* Emergency Notice */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-medium text-red-800 mb-2">Bei Notfällen</h3>
        <p className="text-sm text-red-700">
          Bei akuter Gefahr oder medizinischen Notfällen rufe sofort <strong>112</strong> an.
          Diese Meldung ist <strong>nicht</strong> für Notfälle gedacht.
        </p>
      </div>
    </div>
  )
}

function CategoryCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="card-hover flex items-center gap-4"
    >
      <span className="text-4xl">{icon}</span>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  )
}
