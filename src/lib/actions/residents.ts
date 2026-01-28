'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  ResidentInputSchema,
  ResidentUpdateSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'

export async function createResident(formData: FormData): Promise<void> {
  const data = validateFormData(ResidentInputSchema, formData)

  const resident = await prisma.resident.create({
    data: {
      ...data,
      status: DEFAULT_STATUSES.resident,
    },
  })

  await logAudit({
    action: 'CREATE',
    entity: 'RESIDENT',
    entityId: resident.id,
    changes: { code: data.code },
  })

  revalidatePath('/residents')
  revalidatePath('/matching')
  // Redirect to matching page for immediate placement
  redirect(`/matching?resident=${resident.id}&new=1`)
}

export async function updateResident(formData: FormData): Promise<void> {
  const data = validateFormData(ResidentUpdateSchema, formData)
  const { id, ...updateData } = data

  await prisma.resident.update({
    where: { id },
    data: updateData,
  })

  await logAudit({
    action: 'UPDATE',
    entity: 'RESIDENT',
    entityId: id,
    changes: updateData,
  })

  revalidatePath('/residents')
  revalidatePath(`/residents/${id}`)
  redirect(`/residents/${id}`)
}
