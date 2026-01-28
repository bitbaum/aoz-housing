'use client'

import { useRouter } from 'next/navigation'
import { ActionMenu } from '@/components/ui/ActionMenu'

interface HousingCardActionsProps {
  housingId: string
}

export function HousingCardActions({ housingId }: HousingCardActionsProps) {
  const router = useRouter()

  return (
    <ActionMenu
      onEdit={() => router.push(`/housing/${housingId}/edit`)}
      size="sm"
    />
  )
}
