'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  HousingUnitInputSchema,
  HousingUnitUpdateSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'

export async function createHousingUnit(formData: FormData): Promise<void> {
  const data = validateFormData(HousingUnitInputSchema, formData)

  const unit = await prisma.housingUnit.create({
    data: {
      ...data,
      status: 'AVAILABLE',
    },
  })

  await logAudit({
    action: 'CREATE',
    entity: 'HOUSING_UNIT',
    entityId: unit.id,
    changes: { code: data.code, address: data.address },
  })

  revalidatePath('/housing')
  // Redirect to spots page for immediate room/bed setup
  redirect(`/housing/${unit.id}/spots?new=1`)
}

export async function updateHousingUnit(formData: FormData): Promise<void> {
  const data = validateFormData(HousingUnitUpdateSchema, formData)
  const { id, ...updateData } = data

  await prisma.housingUnit.update({
    where: { id },
    data: updateData,
  })

  await logAudit({
    action: 'UPDATE',
    entity: 'HOUSING_UNIT',
    entityId: id,
    changes: updateData,
  })

  revalidatePath('/housing')
  revalidatePath(`/housing/${id}`)
  redirect(`/housing/${id}`)
}
