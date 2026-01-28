'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoomVisualization } from './RoomVisualization'
import { PlacementPanel } from './PlacementPanel'
import { createPlacement } from '@/lib/actions/placements'
import type { HousingSpot, CompatibleResident } from './types'

interface RoomVisualizationWithPlacementProps {
  spots: HousingSpot[]
  housingUnitId: string
  compatibleResidents: CompatibleResident[]
}

export function RoomVisualizationWithPlacement({
  spots,
  housingUnitId,
  compatibleResidents,
}: RoomVisualizationWithPlacementProps) {
  const router = useRouter()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<HousingSpot | null>(null)

  const handleAvailableBedClick = (spot: HousingSpot) => {
    setSelectedSpot(spot)
    setIsPanelOpen(true)
  }

  const handlePlaceResident = async (residentId: string, spotId: string) => {
    await createPlacement({
      residentId,
      housingUnitId,
      spotId,
      startDate: new Date(),
    })
    router.refresh()
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedSpot(null)
  }

  return (
    <>
      <RoomVisualization
        spots={spots}
        housingUnitId={housingUnitId}
        onAvailableBedClick={handleAvailableBedClick}
        useBedGrid={true}
      />

      <PlacementPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        spot={selectedSpot}
        compatibleResidents={compatibleResidents}
        onPlaceResident={handlePlaceResident}
        housingUnitId={housingUnitId}
      />
    </>
  )
}

export default RoomVisualizationWithPlacement
