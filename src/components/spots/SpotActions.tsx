'use client'

import { useRef } from 'react'
import { updateSpot, deleteSpot } from '@/lib/actions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DELETE_CONFIRM_CONFIG } from '@/lib/config/crud-actions'
import { UI_LABELS, SPOT_ACTIONS_LABELS } from '@/lib/constants/labels'

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
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-status-warning hover:bg-status-warning/10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning"
            title={SPOT_ACTIONS_LABELS.setMaintenance}
            aria-label={SPOT_ACTIONS_LABELS.setMaintenance}
          >
            <span aria-hidden="true">🔧</span>
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
            className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-status-success hover:bg-status-success/10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-success"
            title={SPOT_ACTIONS_LABELS.setAvailable}
            aria-label={SPOT_ACTIONS_LABELS.setAvailable}
          >
            <span aria-hidden="true">✓</span>
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
            message={SPOT_ACTIONS_LABELS.deleteMessage}
            confirmLabel={DELETE_CONFIRM_CONFIG.confirmLabel}
            cancelLabel={DELETE_CONFIRM_CONFIG.cancelLabel}
            onConfirm={handleDelete}
            variant="danger"
          >
            <button
              type="button"
              className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-status-error hover:bg-status-error/8 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error"
              title={UI_LABELS.delete}
              aria-label={UI_LABELS.delete}
            >
              <span aria-hidden="true">🗑️</span>
            </button>
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
