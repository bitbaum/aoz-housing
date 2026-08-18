'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { hasPermission } from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'
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
  postedByName: string
  postedById: string
  claimedByName: string | null
  hiddenByStaff: boolean
  hiddenReason: string | null
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
      housingUnit: { select: { id: true, code: true } },
      postedBy: { select: RESIDENT_NAME_SELECT },
      claimedBy: { select: RESIDENT_NAME_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = rows.map(mapPost)
  return {
    own: mapped.filter((post) => post.housingUnitId === auth.placement.housingUnitId),
    other: mapped.filter((post) => post.housingUnitId !== auth.placement.housingUnitId),
  }
}

export async function listStaffMarketplacePosts(): Promise<MarketplacePostSummary[]> {
  const rows = await prisma.marketplacePost.findMany({
    include: {
      housingUnit: { select: { id: true, code: true } },
      postedBy: { select: RESIDENT_NAME_SELECT },
      claimedBy: { select: RESIDENT_NAME_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapPost)
}

function mapPost(row: {
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
  postedBy: { code: string; displayName: string | null }
  claimedBy: { code: string; displayName: string | null } | null
  postedById: string
}): MarketplacePostSummary {
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
    postedByName: residentName(row.postedBy),
    postedById: row.postedById,
    claimedByName: row.claimedBy ? residentName(row.claimedBy) : null,
    hiddenByStaff: row.hiddenByStaff,
    hiddenReason: row.hiddenReason,
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

  await prisma.marketplacePost.create({
    data: {
      housingUnitId: auth.placement.housingUnitId,
      postedById: auth.resident.id,
      title,
      description,
      kind,
      category,
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
