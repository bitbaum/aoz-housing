'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { getResidentCookie } from '@/lib/portal-auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  boardKinds,
  CEFR_LEVELS,
  LEARNING_CATEGORIES,
  type LearningBoardId,
  LEARNING_KINDS,
  LEARNING_STATUSES,
} from '@/lib/config/learning'
import type { LearningKind, LearningStatus, ResidentOrStaff } from '@prisma/client'

const INVALID_RECORD_MESSAGE = 'Art und Bezeichnung sind erforderlich'

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
    throw new Error(INVALID_RECORD_MESSAGE)
  }

  const categoryRaw = String(formData.get('category') || '')
  const category = (LEARNING_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? categoryRaw
    : null

  const cefrRaw = String(formData.get('cefrLevel') || '')
  const cefrLevel = (CEFR_LEVELS as readonly string[]).includes(cefrRaw) ? cefrRaw : null

  const hoursRaw = formData.get('hours')
  const hours = hoursRaw && String(hoursRaw).trim() !== '' ? Number(hoursRaw) : null
  const startedAt = parseDate(formData.get('startedAt'))
  const completedAt = parseDate(formData.get('completedAt'))

  if (startedAt && completedAt && completedAt < startedAt) {
    throw new Error(ERROR_MESSAGES.INVALID_INPUT_DATA)
  }

  return {
    kind,
    title,
    status: parseStatus(formData.get('status')),
    languageCode: String(formData.get('languageCode') || '').trim().toUpperCase() || null,
    cefrLevel,
    provider: String(formData.get('provider') || '').trim() || null,
    category,
    hours: hours !== null && Number.isFinite(hours) && hours >= 0 ? Math.round(hours) : null,
    startedAt,
    completedAt,
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
    if (error instanceof Error && error.message === INVALID_RECORD_MESSAGE) {
      return { success: false, error: ERROR_MESSAGES.INVALID_INPUT_DATA }
    }
    return { success: false, error: error instanceof Error ? error.message : ERROR_MESSAGES.SAVE_ERROR }
  }

  revalidatePath('/portal/learning')
  return { success: true }
}

export async function listLearningQueue(kind?: LearningKind) {
  await requirePermission('learning:read')

  const [records, missingGerman] = await Promise.all([
    prisma.learningRecord.findMany({
      where: {
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        ...(kind ? { kind } : {}),
      },
      include: {
        resident: { select: { id: true, code: true, displayName: true, languages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    kind
      ? Promise.resolve([])
      : prisma.resident.findMany({
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

export interface LearningBoardFilters {
  board: LearningBoardId
  status?: LearningStatus | 'ALL'
  query?: string
  mineOnly?: boolean
  recordedBy?: ResidentOrStaff | 'ALL'
  category?: (typeof LEARNING_CATEGORIES)[number] | 'ALL'
}

export async function listLearningBoard(filters: LearningBoardFilters) {
  const user = await requirePermission('learning:read')
  const query = filters.query?.trim() || ''
  const kinds = boardKinds(filters.board)

  const residentWhere = filters.mineOnly
    ? { careAssignments: { some: { staffId: user.id } } }
    : undefined

  const recordWhere = {
    kind: { in: [...kinds] as LearningKind[] },
    ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
    ...(filters.recordedBy && filters.recordedBy !== 'ALL' ? { recordedBy: filters.recordedBy } : {}),
    ...(filters.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { provider: { contains: query, mode: 'insensitive' as const } },
            { notes: { contains: query, mode: 'insensitive' as const } },
            { resident: { code: { contains: query, mode: 'insensitive' as const } } },
            { resident: { displayName: { contains: query, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
    ...(residentWhere ? { resident: residentWhere } : {}),
  }

  const [records, missingGerman, total, statusGroups, sourceGroups] = await Promise.all([
    prisma.learningRecord.findMany({
      where: recordWhere,
      include: {
        resident: {
          select: {
            id: true,
            code: true,
            displayName: true,
            supportLevel: true,
            placements: {
              where: { status: 'ACTIVE' },
              select: { housingUnit: { select: { code: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
    }),
    filters.board === 'volunteering'
      ? Promise.resolve([])
      : prisma.resident.findMany({
          where: {
            status: { in: ['ACTIVE', 'PLACED'] },
            learningRecords: {
              none: { kind: 'LANGUAGE_TEST', languageCode: 'DE' },
            },
            ...(residentWhere || {}),
          },
          select: {
            id: true,
            code: true,
            displayName: true,
            supportLevel: true,
            placements: {
              where: { status: 'ACTIVE' },
              select: { housingUnit: { select: { code: true } } },
              take: 1,
            },
          },
          orderBy: { code: 'asc' },
          take: 40,
        }),
    prisma.learningRecord.count({ where: recordWhere }),
    prisma.learningRecord.groupBy({
      by: ['status'],
      where: recordWhere,
      _count: { _all: true },
    }),
    prisma.learningRecord.groupBy({
      by: ['recordedBy'],
      where: recordWhere,
      _count: { _all: true },
    }),
  ])

  const stats = {
    total,
    planned: statusGroups.find((group) => group.status === 'PLANNED')?._count._all ?? 0,
    inProgress: statusGroups.find((group) => group.status === 'IN_PROGRESS')?._count._all ?? 0,
    completed: statusGroups.find((group) => group.status === 'COMPLETED')?._count._all ?? 0,
    residentLogged:
      sourceGroups.find((group) => group.recordedBy === 'RESIDENT')?._count._all ?? 0,
    staffLogged: sourceGroups.find((group) => group.recordedBy === 'STAFF')?._count._all ?? 0,
  }

  return { user, records, missingGerman, stats }
}

export async function listResidentLearningEvidence() {
  const code = await getResidentCookie()
  if (!code) return null

  return prisma.resident.findUnique({
    where: { code },
    select: {
      id: true,
      learningRecords: { orderBy: { updatedAt: 'desc' } },
    },
  })
}
