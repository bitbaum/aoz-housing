'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { getResidentCookie } from '@/lib/portal-auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  CEFR_LEVELS,
  LEARNING_CATEGORIES,
  LEARNING_KINDS,
  LEARNING_STATUSES,
} from '@/lib/config/learning'
import type { LearningKind, LearningStatus, ResidentOrStaff } from '@prisma/client'

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== 'string' || value.trim() === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseKind(value: FormDataEntryValue | null): LearningKind | null {
  if (typeof value !== 'string') return null
  return (LEARNING_KINDS as readonly string[]).includes(value)
    ? (value as LearningKind)
    : null
}

function parseStatus(value: FormDataEntryValue | null): LearningStatus {
  if (typeof value === 'string' && (LEARNING_STATUSES as readonly string[]).includes(value)) {
    return value as LearningStatus
  }
  return 'PLANNED'
}

function parseRecord(formData: FormData) {
  const kind = parseKind(formData.get('kind'))
  const title = String(formData.get('title') || '').trim()
  if (!kind || title.length < 2) {
    throw new Error('Art und Bezeichnung sind erforderlich')
  }

  const categoryRaw = String(formData.get('category') || '')
  const category = (LEARNING_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? categoryRaw
    : null

  const cefrRaw = String(formData.get('cefrLevel') || '')
  const cefrLevel = (CEFR_LEVELS as readonly string[]).includes(cefrRaw) ? cefrRaw : null

  const hoursRaw = formData.get('hours')
  const hours = hoursRaw && String(hoursRaw).trim() !== '' ? Number(hoursRaw) : null

  return {
    kind,
    title,
    status: parseStatus(formData.get('status')),
    languageCode: String(formData.get('languageCode') || '').trim().toUpperCase() || null,
    cefrLevel,
    provider: String(formData.get('provider') || '').trim() || null,
    category,
    hours: hours !== null && Number.isFinite(hours) && hours >= 0 ? Math.round(hours) : null,
    startedAt: parseDate(formData.get('startedAt')),
    completedAt: parseDate(formData.get('completedAt')),
    notes: String(formData.get('notes') || '').trim() || null,
  }
}

export async function createLearningRecordForResident(formData: FormData): Promise<void> {
  const user = await requirePermission('learning:write')
  const residentId = String(formData.get('residentId') || '')
  if (!residentId) throw new Error(ERROR_MESSAGES.RESIDENT_NOT_FOUND)

  const data = parseRecord(formData)
  await prisma.learningRecord.create({
    data: { ...data, residentId, recordedBy: 'STAFF' as ResidentOrStaff },
  })

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/learning')
  void user
}

export async function createOwnLearningRecord(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const code = await getResidentCookie()
  if (!code) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const resident = await prisma.resident.findUnique({
    where: { code },
    select: { id: true },
  })
  if (!resident) return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }

  try {
    const data = parseRecord(formData)
    await prisma.learningRecord.create({
      data: { ...data, residentId: resident.id, recordedBy: 'RESIDENT' },
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.SAVE_ERROR }
  }

  revalidatePath('/portal/learning')
  return { success: true }
}

export async function listLearningQueue() {
  await requirePermission('learning:read')

  const [records, missingGerman] = await Promise.all([
    prisma.learningRecord.findMany({
      where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
      include: {
        resident: { select: { id: true, code: true, displayName: true, languages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.resident.findMany({
      where: {
        status: { in: ['ACTIVE', 'PLACED'] },
        learningRecords: {
          none: { kind: 'LANGUAGE_TEST', languageCode: 'DE' },
        },
      },
      select: { id: true, code: true, displayName: true, languages: true },
      orderBy: { code: 'asc' },
      take: 40,
    }),
  ])

  return { records, missingGerman }
}
