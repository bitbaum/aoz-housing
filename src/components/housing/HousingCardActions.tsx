'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { archiveHousingUnit, restoreHousingUnit } from '@/lib/actions'

interface HousingCardActionsProps {
  housingId: string
  status: string
}

export function HousingCardActions({ housingId, status }: HousingCardActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isArchived = status === 'CLOSED'

  const handleArchiveToggle = () => {
    if (isPending) return
    startTransition(async () => {
      const result = isArchived
        ? await restoreHousingUnit(housingId)
        : await archiveHousingUnit(housingId)

      if (!result.success) {
        alert(result.error || 'Aktion fehlgeschlagen')
        return
      }

      router.refresh()
    })
  }

  return (
    <ActionMenu
      onEdit={() => router.push(`/housing/${housingId}/edit`)}
      onDelete={handleArchiveToggle}
      deleteLabel={isArchived ? 'Wiederherstellen' : 'Archivieren'}
      size="sm"
    />
  )
}
