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
  searchParams: Promise<{ new?: string }>
}

export default async function SpotManagementPage({ params, searchParams }: Props) {
  const { id } = await params
  const { new: isNewUnit } = await searchParams

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
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/housing/${id}`}
              className="text-aoz-primary hover:underline text-sm"
            >
              &larr; Zurück zur Unterkunft
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {isNewUnit ? 'Zimmer & Betten einrichten' : 'Plätze verwalten'}: {unit.code}
            </h1>
            <p className="text-gray-500">{unit.address}</p>
          </div>
          {isNewUnit && unit.spots.length > 0 && (
            <Link href={`/housing/${id}`} className="btn-primary">
              Fertig &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Welcome Banner for new units */}
      {isNewUnit && unit.spots.length === 0 && (
        <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🏢</span>
            <div className="flex-1">
              <h2 className="font-bold text-blue-900 text-lg mb-2">
                Schritt 2 von 2: Zimmer und Betten einrichten
              </h2>
              <p className="text-sm text-blue-800 mb-4">
                Sie haben das Gebäude <strong>{unit.code}</strong> erstellt. Jetzt fügen Sie die Zimmer und Betten hinzu.
              </p>

              {/* Hierarchy Explanation */}
              <div className="bg-white p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">So funktioniert die Hierarchie:</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">🏢 Gebäude</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">🚪 Zimmer</span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">🛏️ Betten</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  • <strong>Zimmer</strong> = gemeinsam genutzter Raum (z.B. Schlafzimmer mit 2-4 Betten)<br/>
                  • <strong>Betten</strong> = einzelne Schlafplätze in einem Zimmer
                </p>
              </div>

              {/* Quick Start Steps */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-blue-900">Code eingeben (z.B. <code className="bg-white px-1 rounded">Z1</code>)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-blue-900">Anzahl Betten wählen</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-blue-900">&quot;Zimmer erstellen&quot; klicken</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">➕</span>
          <h2 className="text-lg font-semibold text-gray-900">
            {isNewUnit && unit.spots.length === 0 ? 'Zimmer & Betten erstellen' : 'Plätze hinzufügen'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Room with Beds */}
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚪</span>
              <h3 className="font-semibold text-green-900">
                Gemeinsames Zimmer (mit mehreren Betten)
              </h3>
            </div>
            <p className="text-xs text-green-700 mb-4">
              Erstellt 1 Zimmer + die angegebene Anzahl Betten darin
            </p>
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
          <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏠</span>
              <h3 className="font-semibold text-purple-900">
                Privatzimmer oder Studio
              </h3>
            </div>
            <p className="text-xs text-purple-700 mb-4">
              Einzelplatz ohne gemeinsam genutztes Schlafzimmer
            </p>
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
