'use client'

import { updateSpot, deleteSpot } from '@/lib/actions'

interface SpotActionsProps {
  spot: any
  housingUnitId: string
}

export function SpotActions({ spot, housingUnitId }: SpotActionsProps) {
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
