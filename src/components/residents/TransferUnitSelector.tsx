'use client'

import { UI_LABELS, PLACEMENT_ACTIONS_LABELS } from '@/lib/constants'
import type { UnitWithSpots } from '@/lib/types'
import { TransferRecommendations } from './TransferRecommendations'
import type { UnitCompatibilityData } from './TransferRecommendations'

interface TransferUnitSelectorProps {
  eligibleUnits: UnitWithSpots[]
  eligibleSpotTypes: string[]
  selectedUnitId: string
  onUnitSelect: (unitId: string) => void
  unitCompatibility?: Record<string, UnitCompatibilityData>
}

export function TransferUnitSelector({
  eligibleUnits,
  eligibleSpotTypes,
  selectedUnitId,
  onUnitSelect,
  unitCompatibility,
}: TransferUnitSelectorProps) {
  if (unitCompatibility && Object.keys(unitCompatibility).length > 0) {
    return (
      <TransferRecommendations
        eligibleUnits={eligibleUnits}
        eligibleSpotTypes={eligibleSpotTypes}
        selectedUnitId={selectedUnitId}
        onUnitSelect={onUnitSelect}
        unitCompatibility={unitCompatibility}
      />
    )
  }

  return (
    <select
      name="targetHousingUnitId"
      required
      className="input"
      value={selectedUnitId}
      onChange={(e) => onUnitSelect(e.target.value)}
    >
      <option value="">{UI_LABELS.selectPlaceholder}</option>
      {eligibleUnits.map((unit) => {
        const eligibleSpots = unit.spots.filter((spot) => eligibleSpotTypes.includes(spot.type))
        return (
          <option key={unit.id} value={unit.id}>
            {unit.code} - {unit.address} (
            {PLACEMENT_ACTIONS_LABELS.spotsAvailableCount(eligibleSpots.length)})
          </option>
        )
      })}
    </select>
  )
}

export type { UnitCompatibilityData }
