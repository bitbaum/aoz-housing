'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  validateFormData,
  IncidentInputSchema,
  ResolveIncidentSchema,
  FollowUpInputSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'

// Simple schema for clearing follow-up
const ClearFollowUpSchema = z.object({
  incidentId: z.string().cuid(),
})

export async function createIncident(formData: FormData): Promise<void> {
  const data = validateFormData(IncidentInputSchema, formData)

  const incident = await prisma.incident.create({
    data: {
      housingUnitId: data.housingUnitId,
      reportedById: data.reportedById || undefined,
      subjectId: data.subjectId || undefined,
      category: data.category,
      type: data.type,
      severity: data.severity,
      description: data.description,
      date: data.date,
    },
  })

  await logAudit({
    action: 'CREATE',
    entity: 'INCIDENT',
    entityId: incident.id,
    changes: {
      category: data.category,
      type: data.type,
      severity: data.severity,
      housingUnitId: data.housingUnitId,
    },
  })

  redirect('/incidents')
}

export async function resolveIncident(formData: FormData): Promise<void> {
  const { incidentId, resolution } = validateFormData(ResolveIncidentSchema, formData)

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      resolvedAt: new Date(),
      resolution,
    },
  })

  await logAudit({
    action: 'RESOLVE',
    entity: 'INCIDENT',
    entityId: incidentId,
    changes: { resolution },
  })

  revalidatePath('/incidents')
}

export interface ResidentIncidentStats {
  reported: number      // Incidents this person reported
  asSubject: number     // Incidents where this person was the subject/cause
  involved: number      // Incidents where they were involved
  total: number         // Total unique incidents
}

export async function getResidentIncidentStats(residentId: string): Promise<ResidentIncidentStats> {
  const [reported, asSubject, involved] = await Promise.all([
    prisma.incident.count({
      where: { reportedById: residentId },
    }),
    prisma.incident.count({
      where: { subjectId: residentId },
    }),
    prisma.incidentInvolvement.count({
      where: { residentId },
    }),
  ])

  // Count unique incidents (reporter, subject, or involved)
  const uniqueIncidents = await prisma.incident.findMany({
    where: {
      OR: [
        { reportedById: residentId },
        { subjectId: residentId },
        { involvedResidents: { some: { residentId } } },
      ],
    },
    select: { id: true },
  })

  return {
    reported,
    asSubject,
    involved,
    total: uniqueIncidents.length,
  }
}

export async function getHousingUnitIncidentHistory(housingUnitId: string) {
  const incidents = await prisma.incident.findMany({
    where: { housingUnitId },
    include: {
      reportedBy: { select: { id: true, code: true } },
      subject: { select: { id: true, code: true } },
      involvedResidents: {
        include: {
          resident: { select: { id: true, code: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 50,
  })

  // Calculate which residents appear most frequently as subjects
  const subjectCounts: Record<string, { code: string; count: number }> = {}
  for (const incident of incidents) {
    if (incident.subject) {
      const id = incident.subject.id
      if (!subjectCounts[id]) {
        subjectCounts[id] = { code: incident.subject.code, count: 0 }
      }
      subjectCounts[id].count++
    }
  }

  const frequentSubjects = Object.entries(subjectCounts)
    .map(([id, data]) => ({ id, ...data }))
    .filter((s) => s.count >= 2)
    .sort((a, b) => b.count - a.count)

  return {
    incidents,
    stats: {
      total: incidents.length,
      open: incidents.filter((i) => !i.resolvedAt).length,
      interpersonal: incidents.filter((i) => i.category === 'INTERPERSONAL').length,
      maintenance: incidents.filter((i) => i.category === 'MAINTENANCE').length,
    },
    frequentSubjects,
  }
}

// =============================================================================
// FOLLOW-UP ACTIONS
// =============================================================================

export async function addFollowUp(formData: FormData): Promise<void> {
  const data = validateFormData(FollowUpInputSchema, formData)

  // Create the follow-up record
  const followUp = await prisma.incidentFollowUp.create({
    data: {
      incidentId: data.incidentId,
      action: data.action,
      notes: data.notes,
      outcome: data.outcome,
      staffName: data.staffName,
      scheduledNextDate: data.scheduledNextDate,
    },
  })

  // Update the incident with next follow-up date and priority
  const updateData: Record<string, Date | string | null> = {}
  if (data.scheduledNextDate) {
    updateData.nextFollowUpDate = data.scheduledNextDate
  }
  if (data.followUpPriority) {
    updateData.followUpPriority = data.followUpPriority
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.incident.update({
      where: { id: data.incidentId },
      data: updateData,
    })
  }

  await logAudit({
    action: 'CREATE',
    entity: 'INCIDENT',
    entityId: data.incidentId,
    changes: { followUpId: followUp.id, action: data.action },
  })

  revalidatePath('/incidents')
  revalidatePath(`/incidents/${data.incidentId}`)
}

export async function getIncidentWithFollowUps(incidentId: string) {
  return prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      housingUnit: true,
      reportedBy: true,
      subject: true,
      involvedResidents: {
        include: { resident: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getIncidentsNeedingFollowUp() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const threeDays = new Date(now)
  threeDays.setDate(threeDays.getDate() + 3)

  // Get overdue incidents (follow-up date passed but not resolved)
  const overdue = await prisma.incident.findMany({
    where: {
      resolvedAt: null,
      nextFollowUpDate: { lt: now },
    },
    include: {
      housingUnit: true,
      subject: true,
      _count: { select: { followUps: true } },
    },
    orderBy: { nextFollowUpDate: 'asc' },
  })

  // Get incidents due today/tomorrow
  const dueSoon = await prisma.incident.findMany({
    where: {
      resolvedAt: null,
      nextFollowUpDate: { gte: now, lte: tomorrow },
    },
    include: {
      housingUnit: true,
      subject: true,
      _count: { select: { followUps: true } },
    },
    orderBy: { nextFollowUpDate: 'asc' },
  })

  // Get incidents with urgent priority regardless of date
  const urgent = await prisma.incident.findMany({
    where: {
      resolvedAt: null,
      followUpPriority: { in: ['URGENT', 'HIGH'] },
      nextFollowUpDate: { gte: tomorrow }, // Not already in dueSoon
    },
    include: {
      housingUnit: true,
      subject: true,
      _count: { select: { followUps: true } },
    },
    orderBy: { followUpPriority: 'asc' },
  })

  return { overdue, dueSoon, urgent }
}

export async function clearFollowUpReminder(formData: FormData): Promise<void> {
  const { incidentId } = validateFormData(ClearFollowUpSchema, formData)

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      nextFollowUpDate: null,
      followUpPriority: null,
    },
  })

  revalidatePath('/incidents')
}
