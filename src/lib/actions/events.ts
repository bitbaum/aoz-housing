'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { hasPermission } from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'
import { fromDatetimeLocalInput } from '@/lib/utils/local-time'
import type { EventRsvpStatus, HouseEventCategory, HouseEventStatus } from '@prisma/client'

const CATEGORIES: HouseEventCategory[] = ['HOUSE_MEETING', 'SOCIAL', 'CULTURE', 'SUPPORT']
const RSVP_STATUSES: EventRsvpStatus[] = ['GOING', 'MAYBE', 'DECLINED']

export type HouseEventSummary = {
  id: string
  title: string
  description: string
  category: HouseEventCategory
  location: string | null
  startsAt: Date
  status: HouseEventStatus
  housingUnitId: string
  housingUnitCode: string
  createdByName: string | null
  createdByResidentId: string | null
  rsvps: { residentId: string; residentName: string; status: EventRsvpStatus }[]
}

function parseCategory(value: FormDataEntryValue | null): HouseEventCategory {
  return typeof value === 'string' && (CATEGORIES as string[]).includes(value)
    ? (value as HouseEventCategory)
    : 'SOCIAL'
}

function parseRsvpStatus(value: FormDataEntryValue | null): EventRsvpStatus | null {
  return typeof value === 'string' && (RSVP_STATUSES as string[]).includes(value)
    ? (value as EventRsvpStatus)
    : null
}

function revalidateEvents() {
  revalidatePath('/portal/events')
  revalidatePath('/events')
}

function mapEvent(row: {
  id: string
  title: string
  description: string
  category: HouseEventCategory
  location: string | null
  startsAt: Date
  status: HouseEventStatus
  housingUnit: { id: string; code: string }
  createdByStaff: { name: string } | null
  createdByResident: { id: string; code: string; displayName: string | null } | null
  rsvps: {
    residentId: string
    status: EventRsvpStatus
    resident: { code: string; displayName: string | null }
  }[]
}): HouseEventSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    startsAt: row.startsAt,
    status: row.status,
    housingUnitId: row.housingUnit.id,
    housingUnitCode: row.housingUnit.code,
    createdByName:
      row.createdByStaff?.name ??
      (row.createdByResident ? residentName(row.createdByResident) : null),
    createdByResidentId: row.createdByResident?.id ?? null,
    rsvps: row.rsvps.map((rsvp) => ({
      residentId: rsvp.residentId,
      residentName: residentName(rsvp.resident),
      status: rsvp.status,
    })),
  }
}

/**
 * The unit's events, split by whether they have happened yet.
 *
 * One list sorted ascending put last month's Frühlingsputz above next week's
 * Hausversammlung and asked a resident to RSVP to both. What is coming is the
 * only part anyone can act on, so it comes first and in the order it will
 * happen; what is done is a record, so it reads newest-first.
 */
export async function listUnitEvents(now: Date = new Date()): Promise<{
  upcoming: HouseEventSummary[]
  past: HouseEventSummary[]
} | null> {
  const auth = await getPortalAuth()
  if (!auth) return null

  const rows = await prisma.houseEvent.findMany({
    where: { housingUnitId: auth.placement.housingUnitId, status: { not: 'CANCELLED' } },
    include: {
      housingUnit: { select: { id: true, code: true } },
      createdByStaff: { select: { name: true } },
      createdByResident: { select: RESIDENT_NAME_SELECT },
      rsvps: { include: { resident: { select: RESIDENT_NAME_SELECT } } },
    },
    orderBy: { startsAt: 'asc' },
  })

  const mapped = rows.map(mapEvent)
  return {
    upcoming: mapped.filter((event) => event.startsAt >= now),
    past: mapped.filter((event) => event.startsAt < now).reverse(),
  }
}

export async function listStaffEvents(): Promise<HouseEventSummary[]> {
  const rows = await prisma.houseEvent.findMany({
    include: {
      housingUnit: { select: { id: true, code: true } },
      createdByStaff: { select: { name: true } },
      createdByResident: { select: RESIDENT_NAME_SELECT },
      rsvps: { include: { resident: { select: RESIDENT_NAME_SELECT } } },
    },
    orderBy: { startsAt: 'desc' },
  })
  return rows.map(mapEvent)
}

export async function createEventAsResident(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const location = String(formData.get('location') || '').trim() || null
  const startsAt = fromDatetimeLocalInput(String(formData.get('startsAt') || ''))
  const category = parseCategory(formData.get('category'))
  if (!title || !description || !startsAt) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  await prisma.houseEvent.create({
    data: {
      housingUnitId: auth.placement.housingUnitId,
      createdByResidentId: auth.resident.id,
      title,
      description,
      location,
      startsAt,
      category,
    },
  })

  revalidateEvents()
  return { success: true }
}

export async function createEventAsStaff(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user, 'events:write')) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const housingUnitId = String(formData.get('housingUnitId') || '')
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const location = String(formData.get('location') || '').trim() || null
  const startsAt = fromDatetimeLocalInput(String(formData.get('startsAt') || ''))
  const category = parseCategory(formData.get('category'))
  if (!housingUnitId || !title || !description || !startsAt) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  await prisma.houseEvent.create({
    data: {
      housingUnitId,
      createdByStaffId: user.id,
      title,
      description,
      location,
      startsAt,
      category,
    },
  })

  revalidateEvents()
  return { success: true }
}

export async function rsvpToEvent(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const eventId = String(formData.get('eventId') || '')
  const status = parseRsvpStatus(formData.get('status'))
  if (!eventId || !status) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  // The id arrived in a form field, so it is a claim, not a fact. Without this
  // check any resident could answer any unit's event by id — and since the
  // attendee list renders NAMES, that puts a stranger into another household's
  // "wer kommt" list, which is a privacy leak wearing the costume of an RSVP.
  const event = await prisma.houseEvent.findUnique({
    where: { id: eventId },
    select: { housingUnitId: true, status: true },
  })
  if (
    !event ||
    event.housingUnitId !== auth.placement.housingUnitId ||
    event.status === 'CANCELLED'
  ) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  await prisma.eventRsvp.upsert({
    where: { eventId_residentId: { eventId, residentId: auth.resident.id } },
    create: { eventId, residentId: auth.resident.id, status },
    update: { status },
  })

  revalidateEvents()
  return { success: true }
}

export async function cancelEvent(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = String(formData.get('id') || '')
  const event = await prisma.houseEvent.findUnique({
    where: { id },
    select: { createdByResidentId: true, createdByStaffId: true },
  })
  if (!event) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  const staffUser = await getCurrentUser()
  if (staffUser && hasPermission(staffUser, 'events:write')) {
    await prisma.houseEvent.update({ where: { id }, data: { status: 'CANCELLED' } })
    revalidateEvents()
    return { success: true }
  }

  const auth = await getPortalAuth()
  if (auth && event.createdByResidentId === auth.resident.id) {
    await prisma.houseEvent.update({ where: { id }, data: { status: 'CANCELLED' } })
    revalidateEvents()
    return { success: true }
  }

  return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
}
