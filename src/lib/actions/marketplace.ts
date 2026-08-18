'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { hasPermission } from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'
import { PHOTO_LIMITS, isAllowedPhotoMimeType } from '@/lib/config/profile'
import { MARKETPLACE_LIMITS } from '@/lib/config/marketplace'
import type {
  MarketplacePostCategory,
  MarketplacePostKind,
  MarketplacePostStatus,
} from '@prisma/client'

const KINDS: MarketplacePostKind[] = ['GIVE_AWAY', 'LEND', 'WANTED']
const CATEGORIES: MarketplacePostCategory[] = [
  'FURNITURE',
  'KITCHEN',
  'CLOTHING',
  'ELECTRONICS',
  'KIDS',
  'OTHER',
]

export type MarketplacePostPhotoSummary = {
  id: string
  isPrimary: boolean
}

export type MarketplacePostSummary = {
  id: string
  title: string
  description: string
  kind: MarketplacePostKind
  category: MarketplacePostCategory
  status: MarketplacePostStatus
  createdAt: Date
  housingUnitId: string
  housingUnitCode: string
  postedByName: string | null
  postedById: string | null
  claimedByName: string | null
  hiddenByStaff: boolean
  hiddenReason: string | null
  photos: MarketplacePostPhotoSummary[]
  /** True when the viewer (a resident) already filed an unresolved report. Always false for staff. */
  reportedByViewer: boolean
}

export type MarketplaceReportSummary = {
  id: string
  postId: string
  postTitle: string
  housingUnitCode: string
  reason: string
  createdAt: Date
  reportedByName: string | null
  resolvedAt: Date | null
  resolution: string | null
  resolvedByName: string | null
}

function parseKind(value: FormDataEntryValue | null): MarketplacePostKind | null {
  return typeof value === 'string' && (KINDS as string[]).includes(value)
    ? (value as MarketplacePostKind)
    : null
}

function parseCategory(value: FormDataEntryValue | null): MarketplacePostCategory {
  return typeof value === 'string' && (CATEGORIES as string[]).includes(value)
    ? (value as MarketplacePostCategory)
    : 'OTHER'
}

function revalidateMarketplace() {
  revalidatePath('/portal/marketplace')
  revalidatePath('/marketplace')
}

const POST_INCLUDE = {
  housingUnit: { select: { id: true, code: true } },
  postedBy: { select: RESIDENT_NAME_SELECT },
  claimedBy: { select: RESIDENT_NAME_SELECT },
  photos: {
    select: { id: true, isPrimary: true },
    orderBy: { isPrimary: 'desc' as const },
  },
} as const

/** Own-unit listings plus every other unit's open listings, own unit first. */
export async function listPortalMarketplacePosts(): Promise<{
  own: MarketplacePostSummary[]
  other: MarketplacePostSummary[]
} | null> {
  const auth = await getPortalAuth()
  if (!auth) return null

  const rows = await prisma.marketplacePost.findMany({
    where: { hiddenByStaff: false },
    include: {
      ...POST_INCLUDE,
      reports: { where: { resolvedAt: null }, select: { reportedById: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = rows.map((row) => mapPost(row, auth.resident.id))
  return {
    own: mapped.filter((post) => post.housingUnitId === auth.placement.housingUnitId),
    other: mapped.filter((post) => post.housingUnitId !== auth.placement.housingUnitId),
  }
}

export async function listStaffMarketplacePosts(): Promise<MarketplacePostSummary[]> {
  const rows = await prisma.marketplacePost.findMany({
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((row) => mapPost(row))
}

/** Open (and recently resolved) moderation reports, unresolved first — the staff queue. */
export async function listStaffMarketplaceReports(): Promise<MarketplaceReportSummary[]> {
  const user = await getCurrentUser()
  if (!user || !hasPermission(user.role, 'marketplace:moderate')) return []

  const rows = await prisma.marketplaceReport.findMany({
    include: {
      post: { select: { id: true, title: true, housingUnit: { select: { code: true } } } },
      reportedBy: { select: RESIDENT_NAME_SELECT },
      resolvedBy: { select: { name: true } },
    },
    orderBy: [{ resolvedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
  })

  return rows.map((row) => ({
    id: row.id,
    postId: row.post.id,
    postTitle: row.post.title,
    housingUnitCode: row.post.housingUnit.code,
    reason: row.reason,
    createdAt: row.createdAt,
    reportedByName: row.reportedBy ? residentName(row.reportedBy) : null,
    resolvedAt: row.resolvedAt,
    resolution: row.resolution,
    resolvedByName: row.resolvedBy?.name ?? null,
  }))
}

function mapPost(
  row: {
    id: string
    title: string
    description: string
    kind: MarketplacePostKind
    category: MarketplacePostCategory
    status: MarketplacePostStatus
    createdAt: Date
    hiddenByStaff: boolean
    hiddenReason: string | null
    housingUnit: { id: string; code: string }
    postedBy: { code: string; displayName: string | null } | null
    postedById: string | null
    claimedBy: { code: string; displayName: string | null } | null
    photos: { id: string; isPrimary: boolean }[]
    reports?: { reportedById: string | null }[]
  },
  viewerResidentId?: string
): MarketplacePostSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    housingUnitId: row.housingUnit.id,
    housingUnitCode: row.housingUnit.code,
    postedByName: row.postedBy ? residentName(row.postedBy) : null,
    postedById: row.postedById,
    claimedByName: row.claimedBy ? residentName(row.claimedBy) : null,
    hiddenByStaff: row.hiddenByStaff,
    hiddenReason: row.hiddenReason,
    photos: row.photos,
    reportedByViewer: viewerResidentId
      ? (row.reports ?? []).some((report) => report.reportedById === viewerResidentId)
      : false,
  }
}

export async function createMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const kind = parseKind(formData.get('kind'))
  const category = parseCategory(formData.get('category'))
  if (!title || !description || !kind) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  const photoFiles = formData.getAll('photos').filter((entry): entry is File => entry instanceof Blob && entry.size > 0)
  if (photoFiles.length > MARKETPLACE_LIMITS.maxPhotosPerPost) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  const photosData: { data: Buffer; mimeType: string; isPrimary: boolean }[] = []
  for (const file of photoFiles) {
    if (!isAllowedPhotoMimeType(file.type)) {
      return { success: false, error: ERROR_MESSAGES.PHOTO_TYPE_INVALID }
    }
    if (file.size > PHOTO_LIMITS.maxBytes) {
      return { success: false, error: ERROR_MESSAGES.PHOTO_TOO_LARGE }
    }
    photosData.push({
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      isPrimary: photosData.length === 0,
    })
  }

  await prisma.marketplacePost.create({
    data: {
      housingUnitId: auth.placement.housingUnitId,
      postedById: auth.resident.id,
      title,
      description,
      kind,
      category,
      photos: photosData.length > 0 ? { create: photosData } : undefined,
    },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function claimMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post || post.status !== 'OPEN') {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  // Claiming a physical item across housing units isn't collectible — keep it
  // scoped to the poster's own unit, same as posting itself.
  if (post.housingUnitId !== auth.placement.housingUnitId) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  await prisma.marketplacePost.update({
    where: { id },
    data: { status: 'CLAIMED', claimedById: auth.resident.id },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function closeMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  const isOwner = post.postedById === auth.resident.id || post.claimedById === auth.resident.id
  if (!isOwner) return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }

  await prisma.marketplacePost.update({
    where: { id },
    data: { status: 'CLOSED', closedAt: new Date() },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function reportMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const reason = String(formData.get('reason') || '').trim().slice(0, MARKETPLACE_LIMITS.maxReportReasonLength)
  if (!id || !reason) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  const post = await prisma.marketplacePost.findUnique({ where: { id }, select: { id: true } })
  if (!post) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  await prisma.marketplaceReport.create({
    data: { postId: id, reportedById: auth.resident.id, reason },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function resolveMarketplaceReport(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user.role, 'marketplace:moderate')) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const id = String(formData.get('id') || '')
  const resolution = String(formData.get('resolution') || '').trim() || null
  if (!id) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  await prisma.marketplaceReport.update({
    where: { id },
    data: { resolvedAt: new Date(), resolvedById: user.id, resolution },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function hideMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user.role, 'marketplace:moderate')) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const id = String(formData.get('id') || '')
  const reason = String(formData.get('reason') || '').trim() || null
  if (!id) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  await prisma.marketplacePost.update({
    where: { id },
    data: { hiddenByStaff: true, hiddenReason: reason },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function unhideMarketplacePost(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user.role, 'marketplace:moderate')) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  const id = String(formData.get('id') || '')
  if (!id) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  await prisma.marketplacePost.update({
    where: { id },
    data: { hiddenByStaff: false, hiddenReason: null },
  })

  revalidateMarketplace()
  return { success: true }
}
