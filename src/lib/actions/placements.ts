'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { EndReason } from '@prisma/client'

export async function endPlacement(formData: FormData) {
  const placementId = formData.get('placementId') as string
  const residentId = formData.get('residentId') as string
  const endReason = formData.get('endReason') as EndReason
  const notes = formData.get('notes') as string

  await prisma.placement.update({
    where: { id: placementId },
    data: {
      status: 'ENDED',
      endDate: new Date(),
      endReason,
      placementNotes: notes || undefined,
    },
  })

  // Update resident status back to ACTIVE (unplaced)
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'ACTIVE' },
  })

  // Update housing unit status if it was full
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      housingUnit: {
        include: { placements: { where: { status: 'ACTIVE' } } },
      },
    },
  })

  if (placement?.housingUnit.status === 'FULL') {
    await prisma.housingUnit.update({
      where: { id: placement.housingUnitId },
      data: { status: 'AVAILABLE' },
    })
  }

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/placements')
  redirect(`/residents/${residentId}`)
}
