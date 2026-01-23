import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  createSpot,
  updateSpot,
  deleteSpot,
  createMultipleSpots,
} from '@/lib/actions'
import {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_ICONS,
  SPOT_STATUS_LABELS,
} from '@/lib/config/placement-spots'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SpotManagementPage({ params }: Props) {
  const { id } = await params

  const unit = await prisma.housingUnit.findUnique({
    where: { id },
    include: {
      spots: {
        include: {
          placements: {
            where: { status: 'ACTIVE' },
            include: { resident: true },
          },
          childSpots: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: { resident: true },
              },
            },
          },
        },
        orderBy: { code: 'asc' },
      },
    },
  })

  if (!unit) {
    notFound()
  }

  // Separate containers (rooms) from standalone spots
  const rooms = unit.spots.filter((s) => s.type === 'ROOM')
  const standaloneSpots = unit.spots.filter(
    (s) => s.type !== 'ROOM' && !s.parentSpotId
  )

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/housing/${id}`}
          className="text-aoz-primary hover:underline text-sm"
        >
          &larr; Zurück zur Unterkunft
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Plätze verwalten: {unit.code}
        </h1>
        <p className="text-gray-500">{unit.address}</p>
      </div>

      {/* Quick Add Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Schnell hinzufügen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Room with Beds */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Zimmer mit Betten
            </h3>
            <form action={createMultipleSpots} className="space-y-3">
              <input type="hidden" name="housingUnitId" value={id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Zimmer-Code *</label>
                  <input
                    type="text"
                    name="roomCode"
                    required
                    placeholder="z.B. R1, Z101"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Anzahl Betten *</label>
                  <input
                    type="number"
                    name="bedCount"
                    required
                    min="1"
                    max="8"
                    defaultValue="2"
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fläche (m²)</label>
                  <input
                    type="number"
                    name="squareMeters"
                    step="0.1"
                    placeholder="z.B. 18"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Stockwerk</label>
                  <input
                    type="number"
                    name="floor"
                    min="-1"
                    max="20"
                    placeholder="z.B. 0, 1, 2"
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Bezeichnung</label>
                <input
                  type="text"
                  name="roomLabel"
                  placeholder="z.B. Zimmer Nord"
                  className="input"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Zimmer erstellen
              </button>
            </form>
          </div>

          {/* Add Single Spot */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Einzelner Platz</h3>
            <form action={createSpot} className="space-y-3">
              <input type="hidden" name="housingUnitId" value={id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Code *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="z.B. EZ1, ST-A"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Typ *</label>
                  <select name="type" required className="input">
                    <option value="BED">{SPOT_TYPE_LABELS.BED}</option>
                    <option value="PRIVATE_ROOM">
                      {SPOT_TYPE_LABELS.PRIVATE_ROOM}
                    </option>
                    <option value="STUDIO">{SPOT_TYPE_LABELS.STUDIO}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Bezeichnung</label>
                <input
                  type="text"
                  name="label"
                  placeholder="z.B. Einzelzimmer Süd"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fläche (m²)</label>
                  <input
                    type="number"
                    name="squareMeters"
                    step="0.1"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Stockwerk</label>
                  <input type="number" name="floor" className="input" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="requiresMedicalDocs"
                  value="true"
                  className="w-4 h-4 rounded border-gray-300 text-aoz-primary"
                />
                <span className="text-sm text-gray-700">
                  Erfordert med. Dokumentation
                </span>
              </label>
              <button type="submit" className="btn-primary w-full">
                Platz erstellen
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Existing Spots */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Vorhandene Plätze ({unit.spots.length})
        </h2>

        {unit.spots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-3xl mb-2 block">📦</span>
            Noch keine Plätze definiert
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rooms with beds */}
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{SPOT_TYPE_ICONS.ROOM}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {room.label || room.code}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {room.squareMeters && `${room.squareMeters}m² · `}
                        {room.childSpots?.length || 0} Betten
                        {room.floor !== null && ` · ${room.floor}. Stock`}
                      </p>
                    </div>
                  </div>
                  <SpotActions spot={room} housingUnitId={id} />
                </div>
                <div className="p-4 space-y-2">
                  {room.childSpots?.map((bed) => (
                    <SpotRow
                      key={bed.id}
                      spot={bed}
                      housingUnitId={id}
                      compact
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Standalone spots */}
            {standaloneSpots.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Einzelne Plätze
                </h3>
                {standaloneSpots.map((spot) => (
                  <SpotRow key={spot.id} spot={spot} housingUnitId={id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SpotRow({
  spot,
  housingUnitId,
  compact = false,
}: {
  spot: any
  housingUnitId: string
  compact?: boolean
}) {
  const activePlacement = spot.placements?.[0]
  const isOccupied = !!activePlacement
  const icon = SPOT_TYPE_ICONS[spot.type as keyof typeof SPOT_TYPE_ICONS] || '📍'

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isOccupied
          ? 'bg-blue-50 border-blue-200'
          : spot.status === 'AVAILABLE'
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
      } ${compact ? 'py-2' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span className={compact ? 'text-lg' : 'text-xl'}>{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-medium ${compact ? 'text-sm' : ''} text-gray-900`}
            >
              {spot.label || spot.code}
            </span>
            {spot.requiresMedicalDocs && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                Med.
              </span>
            )}
          </div>
          {isOccupied ? (
            <Link
              href={`/residents/${activePlacement.resident.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {activePlacement.resident.code}
            </Link>
          ) : (
            <span className="text-sm text-gray-500">
              {SPOT_STATUS_LABELS[spot.status as keyof typeof SPOT_STATUS_LABELS]}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOccupied ? (
          <span className="badge badge-info text-xs">Belegt</span>
        ) : spot.status === 'AVAILABLE' ? (
          <span className="badge badge-success text-xs">Frei</span>
        ) : (
          <span className="badge badge-pending text-xs">
            {SPOT_STATUS_LABELS[spot.status as keyof typeof SPOT_STATUS_LABELS]}
          </span>
        )}
        <SpotActions spot={spot} housingUnitId={housingUnitId} />
      </div>
    </div>
  )
}

function SpotActions({
  spot,
  housingUnitId,
}: {
  spot: any
  housingUnitId: string
}) {
  const hasActivePlacement = spot.placements?.some(
    (p: any) => p.status === 'ACTIVE'
  )

  return (
    <div className="flex items-center gap-1">
      {/* Status toggle */}
      {!hasActivePlacement && spot.status === 'AVAILABLE' && (
        <form action={updateSpot}>
          <input type="hidden" name="id" value={spot.id} />
          <input type="hidden" name="housingUnitId" value={housingUnitId} />
          <input type="hidden" name="type" value={spot.type} />
          <input type="hidden" name="status" value="MAINTENANCE" />
          <button
            type="submit"
            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
            title="In Wartung setzen"
          >
            🔧
          </button>
        </form>
      )}
      {!hasActivePlacement && spot.status === 'MAINTENANCE' && (
        <form action={updateSpot}>
          <input type="hidden" name="id" value={spot.id} />
          <input type="hidden" name="housingUnitId" value={housingUnitId} />
          <input type="hidden" name="type" value={spot.type} />
          <input type="hidden" name="status" value="AVAILABLE" />
          <button
            type="submit"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
            title="Wieder verfügbar"
          >
            ✓
          </button>
        </form>
      )}

      {/* Delete */}
      {!hasActivePlacement && (
        <form action={deleteSpot}>
          <input type="hidden" name="id" value={spot.id} />
          <input type="hidden" name="housingUnitId" value={housingUnitId} />
          <button
            type="submit"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Löschen"
            onClick={(e) => {
              if (!confirm('Diesen Platz wirklich löschen?')) {
                e.preventDefault()
              }
            }}
          >
            🗑️
          </button>
        </form>
      )}
    </div>
  )
}
