'use client'

import { useRouter } from 'next/navigation'
import { ActionMenu } from '@/components/ui/ActionMenu'

interface ResidentCardActionsProps {
  residentId: string
}

export function ResidentCardActions({ residentId }: ResidentCardActionsProps) {
  const router = useRouter()

  return (
    <ActionMenu
      onEdit={() => router.push(`/residents/${residentId}/edit`)}
      size="sm"
    />
  )
}
