'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission, isStaffRole, type StaffRole } from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  APPOINTMENT_STATUSES,
  CARE_ROLES,
  canWriteCareDomain,
  isCatalogKey,
  type AppointmentStatusId,
  type CareRoleId,
} from '@/lib/config/care'
import { fromDatetimeLocalInput } from '@/lib/utils/local-time'
import { weeksBetween } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import type { AppointmentStatus, CareRole } from '@prisma/client'

export type CareSeat = {
  role: CareRoleId
  staffId: string | null
  staffName: string | null
}

export type AssignableStaff = {
  id: string
  name: string
  role: string
}

export type CareAppointment = {
  id: string
  domain: CareRoleId
  title: string
  startsAt: Date
  location: string | null
  notes: string | null
  status: AppointmentStatusId
  staffId: string
  staffName: string
}

export type CareAttributeValue = {
  domain: CareRoleId
  key: string
  value: string
}

/**
 * Returns resident IDs where the given staff user is assigned as a care worker.
 * Used to power the "Meine Klient*innen" filter on the client board.
 */
export async function getMyResidentIds(staffId: string): Promise<string[]> {
  const assignments = await prisma.careAssignment.findMany({
    where: { staffId },
    select: { residentId: true },
  })
  return assignments.map((a) => a.residentId)
}

function canWriteAnyCare(role: string): boolean {
  if (!isStaffRole(role)) return false
  return hasPermission(role, 'residents:write') || hasPermission(role, 'learning:write')
}

function parseDomain(value: FormDataEntryValue | null): CareRole | null {
  if (typeof value !== 'string') return null
  return (CARE_ROLES as readonly string[]).includes(value) ? (value as CareRole) : null
}

function parseStatus(value: FormDataEntryValue | null): AppointmentStatus | null {
  if (typeof value !== 'string') return null
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value)
    ? (value as AppointmentStatus)
    : null
}

function revalidateResident(residentId: string) {
  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/portal')
  revalidatePath('/portal/profile')
  revalidatePath('/')
}

export async function getCareTeam(residentId: string): Promise<CareSeat[]> {
  const assignments = await prisma.careAssignment.findMany({
    where: { residentId },
    include: { staff: { select: { id: true, name: true } } },
  })
  const byRole = new Map(assignments.map((row) => [row.role, row]))

  return CARE_ROLES.map((role) => {
    const row = byRole.get(role)
    return {
      role,
      staffId: row?.staff.id ?? null,
      staffName: row?.staff.name ?? null,
    }
  })
}

export async function listAssignableStaff(): Promise<AssignableStaff[]> {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })
}

export async function listCareAttributes(residentId: string): Promise<CareAttributeValue[]> {
  const rows = await prisma.careAttribute.findMany({ where: { residentId } })
  return rows.map((row) => ({
    domain: row.domain as CareRoleId,
    key: row.key,
    value: row.value,
  }))
}

export async function listResidentAppointments(residentId: string): Promise<CareAppointment[]> {
  const rows = await prisma.appointment.findMany({
    where: { residentId },
    include: { staff: { select: { id: true, name: true } } },
    orderBy: { startsAt: 'asc' },
  })
  return rows.map(mapAppointment)
}

export async function listUpcomingResidentAppointments(
  residentId: string,
  now = new Date()
): Promise<CareAppointment[]> {
  const rows = await prisma.appointment.findMany({
    where: { residentId, status: 'SCHEDULED', startsAt: { gte: now } },
    include: { staff: { select: { id: true, name: true } } },
    orderBy: { startsAt: 'asc' },
    take: 8,
  })
  return rows.map(mapAppointment)
}

function mapAppointment(row: {
  id: string
  domain: CareRole
  title: string
  startsAt: Date
  location: string | null
  notes: string | null
  status: AppointmentStatus
  staff: { id: string; name: string }
}): CareAppointment {
  return {
    id: row.id,
    domain: row.domain as CareRoleId,
    title: row.title,
    startsAt: row.startsAt,
    location: row.location,
    notes: row.notes,
    status: row.status as AppointmentStatusId,
    staffId: row.staff.id,
    staffName: row.staff.name,
  }
}

export async function saveCareSeat(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!canWriteAnyCare(user.role)) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const residentId = String(formData.get('residentId') || '')
  const role = parseDomain(formData.get('role'))
  const staffId = String(formData.get('staffId') || '').trim()
  if (!residentId || !role) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  if (!canWriteCareDomain(user.role as StaffRole, role)) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  if (!staffId) {
    await prisma.careAssignment.deleteMany({ where: { residentId, role } })
  } else {
    const staff = await prisma.user.findFirst({
      where: { id: staffId, active: true },
      select: { id: true },
    })
    if (!staff) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

    await prisma.careAssignment.upsert({
      where: { residentId_role: { residentId, role } },
      create: { residentId, staffId, role },
      update: { staffId },
    })
  }

  revalidateResident(residentId)
  return { success: true }
}

export async function saveCareAttributes(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const residentId = String(formData.get('residentId') || '')
  const domain = parseDomain(formData.get('domain'))
  if (!residentId || !domain) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  if (!canWriteCareDomain(user.role, domain)) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const entries = Array.from(formData.entries()).filter(([name]) => name.startsWith('attr.'))
  for (const [name, raw] of entries) {
    const key = name.slice('attr.'.length)
    if (!isCatalogKey(domain, key)) continue
    const value = String(raw).trim()
    if (!value) {
      await prisma.careAttribute.deleteMany({ where: { residentId, domain, key } })
      continue
    }
    await prisma.careAttribute.upsert({
      where: { residentId_domain_key: { residentId, domain, key } },
      create: { residentId, domain, key, value, updatedById: user.id },
      update: { value, updatedById: user.id },
    })
  }

  revalidateResident(residentId)
  return { success: true }
}

export async function createAppointment(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const residentId = String(formData.get('residentId') || '')
  const domain = parseDomain(formData.get('domain'))
  const title = String(formData.get('title') || '').trim()
  const startsAt = fromDatetimeLocalInput(String(formData.get('startsAt') || ''))
  if (!residentId || !domain || title.length < 2 || !startsAt) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  if (!canWriteCareDomain(user.role, domain)) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const assigned = await prisma.careAssignment.findUnique({
    where: { residentId_role: { residentId, role: domain } },
    select: { staffId: true },
  })
  const staffId = assigned?.staffId || user.id

  await prisma.appointment.create({
    data: {
      residentId,
      staffId,
      domain,
      title,
      startsAt,
      location: String(formData.get('location') || '').trim() || null,
      notes: String(formData.get('notes') || '').trim() || null,
    },
  })

  revalidateResident(residentId)
  return { success: true }
}

export async function setAppointmentStatus(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const status = parseStatus(formData.get('status'))
  if (!id || !status) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { residentId: true, domain: true, checkIn: { select: { id: true } } },
  })
  if (!appointment) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  if (!canWriteCareDomain(user.role, appointment.domain)) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  // How the person was doing, asked in the course of this appointment.
  //
  // Optional on purpose. The alternative — a required field on every
  // completion — buys a number for every meeting by making some of them
  // guesses, and a guessed score is worse than a missing one because it is
  // indistinguishable from an answer. Silence stays silence.
  const rating = parseSatisfaction(formData.get('overallSatisfaction'))
  const concerns = String(formData.get('concerns') || '').trim()

  await prisma.appointment.update({ where: { id }, data: { status } })

  if (status === 'COMPLETED' && rating !== null && !appointment.checkIn) {
    // The check-in hangs off a placement, so someone with no active placement
    // can still have appointments — they just have nothing to attach a
    // reading to. Completing the appointment must not fail because of that.
    const placement = await prisma.placement.findFirst({
      where: { residentId: appointment.residentId, status: 'ACTIVE' },
      select: { id: true, startDate: true },
    })

    if (placement) {
      await prisma.$transaction(async (tx) => {
        await tx.satisfactionCheckIn.create({
          data: {
            placementId: placement.id,
            appointmentId: id,
            checkInType: 'AD_HOC',
            weekNumber: weeksBetween(placement.startDate),
            overallSatisfaction: rating,
            concerns: concerns || null,
            collectedByUserId: user.id,
            isAnonymous: false,
          },
        })
        await tx.placement.update({
          where: { id: placement.id },
          data: { satisfactionRating: rating },
        })
      })

      await logAudit({
        action: 'CREATE',
        entity: 'CHECK_IN',
        entityId: id,
        userId: user.id,
        changes: {
          type: 'APPOINTMENT',
          appointmentId: id,
          domain: appointment.domain,
          overallSatisfaction: rating,
          hasConcerns: !!concerns,
        },
      })
    }
  }

  revalidateResident(appointment.residentId)
  return { success: true }
}

/** 1–5, or null for "not asked". Anything else is not a reading. */
function parseSatisfaction(raw: FormDataEntryValue | null): number | null {
  const value = Number(String(raw ?? ''))
  if (!Number.isInteger(value) || value < 1 || value > 5) return null
  return value
}
