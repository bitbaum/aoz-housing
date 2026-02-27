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
        <p className="text-sm text-gray-500">Belegung</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {occupancy} / {totalBeds}
        </p>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getOccupancyColorClass(occupancyPercent)}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-gray-500">Zimmer</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalRooms}</p>
        <p className="text-sm text-gray-500 mt-1">
          {privateRooms} privat, {sharedRooms} geteilt
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-gray-500">Konflikte (30 Tage)</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {interpersonalIncidents.filter(i =>
            new Date(i.date) > thirtyDaysAgo
          ).length}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {interpersonalIncidents.filter(i => !i.resolvedAt).length} offen
        </p>
      </div>
      <div className="card">
        <p className="text-sm text-gray-500">Wartung</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {maintenanceIncidents.filter(i => !i.resolvedAt).length}
        </p>
        <p className="text-sm text-gray-500 mt-1">offene Meldungen</p>
      </div>
    </div>
  )
}
