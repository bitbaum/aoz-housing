import { DetailRow } from '@/components/ui/Card'

interface UnitDetails {
  privateBathrooms: number
  sharedBathrooms: number
  privateKitchen: boolean
  sharedKitchen: boolean
  wheelchairAccess: boolean
  groundFloor: boolean
  elevator: boolean
  smokingAllowed: boolean
  petsAllowed: boolean
  quietHours: string | null
  nearPublicTransport: boolean
  nearHealthServices: boolean
  nearSchools: boolean
  notes: string | null
}

interface Props {
  unit: UnitDetails
}

export function UnitSidebar({ unit }: Props) {
  return (
    <div className="space-y-6">
      {/* Facilities */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ausstattung
        </h2>
        <dl className="space-y-3 text-sm">
          <DetailRow
            label="Badezimmer"
            value={`${unit.privateBathrooms} privat, ${unit.sharedBathrooms} geteilt`}
          />
          <DetailRow
            label="Küche"
            value={unit.privateKitchen ? 'Privat' : unit.sharedKitchen ? 'Geteilt' : 'Keine'}
          />
          <DetailRow
            label="Barrierefreiheit"
            value={
              unit.wheelchairAccess ? 'Rollstuhlgerecht' :
              unit.groundFloor ? 'Erdgeschoss' :
              unit.elevator ? 'Lift vorhanden' : 'Eingeschränkt'
            }
          />
        </dl>
      </div>

      {/* Rules */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Hausregeln
        </h2>
        <div className="space-y-2 text-sm">
          <RuleItem label="Rauchen" allowed={unit.smokingAllowed} />
          <RuleItem label="Haustiere" allowed={unit.petsAllowed} />
          {unit.quietHours && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-blue-500" aria-hidden="true">🌙</span>
              Ruhezeiten: {unit.quietHours}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lage
        </h2>
        <div className="space-y-2 text-sm">
          <LocationItem label="ÖV" available={unit.nearPublicTransport} />
          <LocationItem label="Gesundheit" available={unit.nearHealthServices} />
          <LocationItem label="Schulen" available={unit.nearSchools} />
        </div>
      </div>

      {/* Notes */}
      {unit.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notizen
          </h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {unit.notes}
          </p>
        </div>
      )}
    </div>
  )
}

function RuleItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={allowed ? 'text-green-500' : 'text-red-500'}>
        {allowed ? '✓' : '✗'}
      </span>
      {label} {allowed ? 'erlaubt' : 'nicht erlaubt'}
    </div>
  )
}

function LocationItem({ label, available }: { label: string; available: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={available ? 'text-green-500' : 'text-gray-400'}>
        {available ? '✓' : '○'}
      </span>
      {label} {available ? 'in der Nähe' : '-'}
    </div>
  )
}
