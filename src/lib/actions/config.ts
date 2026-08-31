'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'

export interface SystemConfigData {
  pilotBaselineIncidentsPerMonth: number | null
  pilotBaselineRelocationsPerMonth: number | null
  pilotBaselineMediationHoursPerWeek: number | null
  pilotStartDate: Date | null
}

export async function getSystemConfig(): Promise<SystemConfigData> {
  const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } })
  return {
    pilotBaselineIncidentsPerMonth: config?.pilotBaselineIncidentsPerMonth ?? null,
    pilotBaselineRelocationsPerMonth: config?.pilotBaselineRelocationsPerMonth ?? null,
    pilotBaselineMediationHoursPerWeek: config?.pilotBaselineMediationHoursPerWeek ?? null,
    pilotStartDate: config?.pilotStartDate ?? null,
  }
}

export async function saveSystemConfig(formData: FormData): Promise<void> {
  await requirePermission('system:configure')

  const parseFloat = (v: FormDataEntryValue | null) => {
    const n = Number(v)
    return v && !isNaN(n) && n >= 0 ? n : null
  }

  const pilotStartRaw = formData.get('pilotStartDate')
  const pilotStartDate = pilotStartRaw ? new Date(pilotStartRaw as string) : null

  await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      pilotBaselineIncidentsPerMonth: parseFloat(formData.get('pilotBaselineIncidentsPerMonth')),
      pilotBaselineRelocationsPerMonth: parseFloat(
        formData.get('pilotBaselineRelocationsPerMonth'),
      ),
      pilotBaselineMediationHoursPerWeek: parseFloat(
        formData.get('pilotBaselineMediationHoursPerWeek'),
      ),
      pilotStartDate,
    },
    update: {
      pilotBaselineIncidentsPerMonth: parseFloat(formData.get('pilotBaselineIncidentsPerMonth')),
      pilotBaselineRelocationsPerMonth: parseFloat(
        formData.get('pilotBaselineRelocationsPerMonth'),
      ),
      pilotBaselineMediationHoursPerWeek: parseFloat(
        formData.get('pilotBaselineMediationHoursPerWeek'),
      ),
      pilotStartDate,
    },
  })

  revalidatePath('/settings')
  revalidatePath('/analytics')
}
