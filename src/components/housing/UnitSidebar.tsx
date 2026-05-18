import { DetailRow } from '@/components/ui/Card'
import { UNIT_SIDEBAR_LABELS } from '@/lib/constants/labels'

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
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {UNIT_SIDEBAR_LABELS.facilitiesTitle}
        </h2>
        <dl className="space-y-3 text-sm">
          <DetailRow
            label={UNIT_SIDEBAR_LABELS.bathroomLabel}
            value={UNIT_SIDEBAR_LABELS.bathroomValue(unit.privateBathrooms, unit.sharedBathrooms)}
          />
          <DetailRow
            label={UNIT_SIDEBAR_LABELS.kitchenLabel}
            value={unit.privateKitchen ? UNIT_SIDEBAR_LABELS.kitchenPrivate : unit.sharedKitchen ? UNIT_SIDEBAR_LABELS.kitchenShared : UNIT_SIDEBAR_LABELS.kitchenNone}
          />
          <DetailRow
            label={UNIT_SIDEBAR_LABELS.accessLabel}
            value={
              unit.wheelchairAccess ? UNIT_SIDEBAR_LABELS.accessWheelchair :
              unit.groundFloor ? UNIT_SIDEBAR_LABELS.accessGroundFloor :
              unit.elevator ? UNIT_SIDEBAR_LABELS.accessElevator : UNIT_SIDEBAR_LABELS.accessLimited
            }
          />
        </dl>
      </div>

      {/* Rules */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {UNIT_SIDEBAR_LABELS.rulesTitle}
        </h2>
        <div className="space-y-2 text-sm">
          <RuleItem label={UNIT_SIDEBAR_LABELS.smokingLabel} allowed={unit.smokingAllowed} />
          <RuleItem label={UNIT_SIDEBAR_LABELS.petsLabel} allowed={unit.petsAllowed} />
          {unit.quietHours && (
            <div className="flex items-center gap-2 text-ui-muted">
              <span className="text-status-info-text" aria-hidden="true">🌙</span>
              {UNIT_SIDEBAR_LABELS.quietHoursPrefix}{unit.quietHours}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {UNIT_SIDEBAR_LABELS.locationTitle}
        </h2>
        <div className="space-y-2 text-sm">
          <LocationItem label={UNIT_SIDEBAR_LABELS.locationPT} available={unit.nearPublicTransport} />
          <LocationItem label={UNIT_SIDEBAR_LABELS.locationHealth} available={unit.nearHealthServices} />
          <LocationItem label={UNIT_SIDEBAR_LABELS.locationSchools} available={unit.nearSchools} />
        </div>
      </div>

      {/* Notes */}
      {unit.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-ui-text mb-4">
            {UNIT_SIDEBAR_LABELS.notesTitle}
          </h2>
          <p className="text-sm text-ui-muted whitespace-pre-wrap">
            {unit.notes}
          </p>
        </div>
      )}
    </div>
  )
}

function RuleItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-ui-muted">
      <span className={allowed ? 'text-status-success-text' : 'text-status-error-text'}>
        {allowed ? '✓' : '✗'}
      </span>
      {label} {allowed ? UNIT_SIDEBAR_LABELS.ruleAllowed : UNIT_SIDEBAR_LABELS.ruleNotAllowed}
    </div>
  )
}

function LocationItem({ label, available }: { label: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${available ? 'text-ui-muted' : 'text-ui-muted'}`}>
      <span className={available ? 'text-status-success-text' : 'text-ui-muted'}>
        {available ? '✓' : '○'}
      </span>
      {label} {available ? UNIT_SIDEBAR_LABELS.locationNearby : UNIT_SIDEBAR_LABELS.locationNotNearby}
    </div>
  )
}
