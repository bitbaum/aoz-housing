import { getOccupancyColorClass, getDateDaysAgo } from '@/lib/utils'

interface Props {
  occupancy: number
  totalBeds: number
  totalRooms: number
  privateRooms: number
  sharedRooms: number
  interpersonalIncidents: { date: Date | string; resolvedAt: Date | string | null }[]
  maintenanceIncidents: { resolvedAt: Date | string | null }[]
}

export function UnitOverviewCards({
  occupancy,
  totalBeds,
  totalRooms,
  privateRooms,
  sharedRooms,
  interpersonalIncidents,
  maintenanceIncidents,
}: Props) {
  const occupancyPercent = Math.round((occupancy / totalBeds) * 100)
  const thirtyDaysAgo = getDateDaysAgo(30)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="card">
        <p className="text-sm text-ui-muted">Belegung</p>
        <p className="text-xl sm:text-2xl font-bold text-ui-text">
          {occupancy} / {totalBeds}
        </p>
        <div className="meter-lg mt-2">
          <div
            className={`meter-fill ${getOccupancyColorClass(occupancyPercent)}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-ui-muted">Zimmer</p>
        <p className="text-xl sm:text-2xl font-bold text-ui-text">{totalRooms}</p>
        <p className="text-sm text-ui-muted mt-1">
          {privateRooms} privat, {sharedRooms} geteilt
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-ui-muted">Konflikte (30 Tage)</p>
        <p className="text-xl sm:text-2xl font-bold text-ui-text">
          {interpersonalIncidents.filter((i) => new Date(i.date) > thirtyDaysAgo).length}
        </p>
        <p className="text-sm text-ui-muted mt-1">
          {interpersonalIncidents.filter((i) => !i.resolvedAt).length} offen
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-ui-muted">Wartung</p>
        <p className="text-xl sm:text-2xl font-bold text-ui-text">
          {maintenanceIncidents.filter((i) => !i.resolvedAt).length}
        </p>
        <p className="text-sm text-ui-muted mt-1">offene Meldungen</p>
      </div>
    </div>
  )
}
