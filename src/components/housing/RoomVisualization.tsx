'use client'

import Link from 'next/link'
import {
  SPOT_TYPE_ICONS,
  SPOT_STATUS_LABELS,
} from '@/lib/config/placement-spots'
import { HOUSING_SPOTS_LABELS, PLACEMENT_PANEL_LABELS } from '@/lib/constants/labels'
import { BedGrid, BedGridSummary } from './BedGrid'
import type { HousingSpot } from './types'

interface RoomVisualizationProps {
  spots: HousingSpot[]
  housingUnitId: string
  onPlaceResident?: (spotId: string) => void
  onAvailableBedClick?: (spot: HousingSpot) => void
  useBedGrid?: boolean
}

/**
 * Hierarchical visualization of rooms and beds in a housing unit
 *
 * Structure:
 * - ROOM spots are containers for BED spots
 * - BED, PRIVATE_ROOM, and STUDIO are assignable spots
 * - Shows occupancy status and resident info
 */
export function RoomVisualization({
  spots,
  housingUnitId,
  onPlaceResident,
  onAvailableBedClick,
  useBedGrid = true,
}: RoomVisualizationProps) {
  // Separate containers (ROOMs) from assignable spots
  const containers = spots.filter((s) => s.type === 'ROOM')
  const assignableTopLevel = spots.filter(
    (s) => s.type !== 'ROOM' && !s.parentSpotId
  )

  // Build hierarchy: attach child spots to their parent containers
  const containersWithChildren = containers.map((container) => ({
    ...container,
    childSpots: spots.filter((s) => s.parentSpotId === container.id),
  }))

  if (spots.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500 mb-4">
          {HOUSING_SPOTS_LABELS.emptyRoomView}
        </p>
        <Link
          href={`/housing/${housingUnitId}/spots/new`}
          className="btn-primary"
        >
          {HOUSING_SPOTS_LABELS.addSpotsBtn}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Render containers (rooms) with their beds */}
      {containersWithChildren.map((container) => (
        <RoomContainer
          key={container.id}
          room={container}
          onPlaceResident={onPlaceResident}
          onAvailableBedClick={onAvailableBedClick}
          useBedGrid={useBedGrid}
        />
      ))}

      {/* Render top-level assignable spots (private rooms, studios without parent) */}
      {assignableTopLevel.length > 0 && (
        <div className="space-y-2">
          {assignableTopLevel.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              onPlaceResident={onPlaceResident}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RoomContainer({
  room,
  onPlaceResident,
  onAvailableBedClick,
  useBedGrid = true,
}: {
  room: HousingSpot & { childSpots?: HousingSpot[] }
  onPlaceResident?: (spotId: string) => void
  onAvailableBedClick?: (spot: HousingSpot) => void
  useBedGrid?: boolean
}) {
  const childSpots = room.childSpots || []
  const occupiedCount = childSpots.filter(
    (s) => s.placements.some((p) => p.status === 'ACTIVE')
  ).length
  const availableCount = childSpots.filter(
    (s) => s.status === 'AVAILABLE' && !s.placements.some((p) => p.status === 'ACTIVE')
  ).length
  const unavailableCount = childSpots.length - occupiedCount - availableCount

  const handleBedClick = (spot: HousingSpot) => {
    if (onAvailableBedClick) {
      onAvailableBedClick(spot)
    } else if (onPlaceResident) {
      onPlaceResident(spot.id)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Room header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{SPOT_TYPE_ICONS.ROOM}</span>
          <div>
            <h4 className="font-medium text-gray-900">
              {room.label || room.code}
            </h4>
            <p className="text-sm text-gray-500">
              {room.squareMeters && `${room.squareMeters}m² · `}
              {occupiedCount}/{childSpots.length} belegt
            </p>
          </div>
        </div>
        {useBedGrid ? (
          <BedGridSummary
            occupied={occupiedCount}
            available={availableCount}
            unavailable={unavailableCount}
          />
        ) : (
          <OccupancyIndicator occupied={occupiedCount} total={childSpots.length} />
        )}
      </div>

      {/* Beds in this room */}
      <div className="p-4">
        {childSpots.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            Keine Betten definiert
          </p>
        ) : useBedGrid ? (
          <BedGrid
            spots={childSpots}
            onBedClick={handleBedClick}
          />
        ) : (
          <div className="space-y-2">
            {childSpots.map((bed) => (
              <SpotCard
                key={bed.id}
                spot={bed}
                compact
                onPlaceResident={onPlaceResident}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SpotCard({
  spot,
  compact = false,
  onPlaceResident,
}: {
  spot: HousingSpot
  compact?: boolean
  onPlaceResident?: (spotId: string) => void
}) {
  const activePlacement = spot.placements.find((p) => p.status === 'ACTIVE')
  const isOccupied = !!activePlacement
  const isAvailable = spot.status === 'AVAILABLE' && !isOccupied

  const icon = SPOT_TYPE_ICONS[spot.type] || '📍'
  const statusLabel = SPOT_STATUS_LABELS[spot.status]

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isOccupied
          ? 'bg-blue-50 border-blue-200'
          : isAvailable
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
              <span
                className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded"
                title={HOUSING_SPOTS_LABELS.requiresMedDocs}
              >
                Med.
              </span>
            )}
          </div>
          {isOccupied && activePlacement ? (
            <Link
              href={`/residents/${activePlacement.resident.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {activePlacement.resident.code}
            </Link>
          ) : (
            <span className="text-sm text-gray-500">{statusLabel}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOccupied ? (
          <span className="badge badge-info text-xs">{HOUSING_SPOTS_LABELS.occupied}</span>
        ) : isAvailable ? (
          <>
            <span className="badge badge-success text-xs">{HOUSING_SPOTS_LABELS.available}</span>
            {onPlaceResident && (
              <button
                onClick={() => onPlaceResident(spot.id)}
                className="btn-primary text-xs px-2 py-1"
              >
                {PLACEMENT_PANEL_LABELS.place}
              </button>
            )}
          </>
        ) : (
          <span className="badge badge-pending text-xs">{statusLabel}</span>
        )}
      </div>
    </div>
  )
}

function OccupancyIndicator({
  occupied,
  total,
}: {
  occupied: number
  total: number
}) {
  const percentage = total > 0 ? (occupied / total) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            percentage === 100
              ? 'bg-blue-500'
              : percentage > 0
                ? 'bg-green-500'
                : 'bg-gray-300'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
    </div>
  )
}

export default RoomVisualization
