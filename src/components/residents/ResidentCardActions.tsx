'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { archiveResident, restoreResident } from '@/lib/actions'

interface ResidentCardActionsProps {
  residentId: string
  status: string
}

export function ResidentCardActions({ residentId, status }: ResidentCardActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isArchived = status === 'EXITED'

  const handleArchiveToggle = () => {
    if (isPending) return
    startTransition(async () => {
      const result = isArchived
        ? await restoreResident(residentId)
        : await archiveResident(residentId)

      if (!result.success) {
        alert(result.error || 'Aktion fehlgeschlagen')
        return
      }

      router.refresh()
    })
  }

  return (
    <ActionMenu
      onEdit={() => router.push(`/residents/${residentId}/edit`)}
      onDelete={handleArchiveToggle}
      deleteLabel={isArchived ? 'Wiederherstellen' : 'Archivieren'}
      size="sm"
    />
  )
}
