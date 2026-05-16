'use client'

import { hardDeleteHousingUnitProtected } from '@/lib/actions'
import { HOUSING_DANGER_ZONE_LABELS, HOUSING_BLOCKER_LABELS } from '@/lib/constants/labels'
import { DangerZone } from '@/components/ui/DangerZone'

interface Props {
  housingUnitId: string
  code: string
}

export function HousingDangerZone({ housingUnitId, code }: Props) {
  return (
    <DangerZone
      entityId={housingUnitId}
      entityCode={code}
      entityType="HousingUnit"
      labels={HOUSING_DANGER_ZONE_LABELS}
      blockerLabels={HOUSING_BLOCKER_LABELS}
      onDelete={hardDeleteHousingUnitProtected}
      redirectPath="/housing?view=all"
      ariaId="housing-danger-zone-title"
    />
  )
}
