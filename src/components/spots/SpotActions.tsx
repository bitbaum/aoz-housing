'use client'

import { useRef } from 'react'
import { updateSpot, deleteSpot } from '@/lib/actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DELETE_CONFIRM_CONFIG } from '@/lib/config/crud-actions'

interface Spot {
  id: string
  type: string
  status: string
  placements?: { status: string }[]
}

interface SpotActionsProps {
  spot: Spot
  housingUnitId: string
}

export function SpotActions({ spot, housingUnitId }: SpotActionsProps) {
  const deleteFormRef = useRef<HTMLFormElement>(null)
  const hasActivePlacement = spot.placements?.some(
    (p) => p.status === 'ACTIVE'
  )

  const handleDelete = async () => {
    deleteFormRef.current?.requestSubmit()
  }

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
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            title="Wieder verfügbar"
          >
            ✓
          </button>
        </form>
      )}

      {/* Delete with ConfirmDialog */}
      {!hasActivePlacement && (
        <>
          <form ref={deleteFormRef} action={deleteSpot} className="hidden">
            <input type="hidden" name="id" value={spot.id} />
            <input type="hidden" name="housingUnitId" value={housingUnitId} />
          </form>
          <ConfirmDialog
            title={DELETE_CONFIRM_CONFIG.title}
            message="Dieser Platz wird unwiderruflich gelöscht."
            confirmLabel={DELETE_CONFIRM_CONFIG.confirmLabel}
            cancelLabel={DELETE_CONFIRM_CONFIG.cancelLabel}
            onConfirm={handleDelete}
            variant="danger"
          >
            <button
              type="button"
              className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Löschen"
            >
              🗑️
            </button>
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
