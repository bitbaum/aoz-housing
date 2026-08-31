'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPortalAuth } from '@/lib/portal-auth'
import { hasPermission } from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { RESIDENT_NAME_SELECT, residentName } from '@/lib/utils/resident-name'
import {
  MARKETPLACE_KIND_VALUES,
  MARKETPLACE_CATEGORY_VALUES,
  categoryFitsKind,
  natureOfKind,
  type MarketplaceNature,
} from '@/lib/config/marketplace'
import type { MarketplacePostKind, MarketplacePostStatus } from '@prisma/client'

export type MarketplacePostSummary = {
  id: string
  title: string
  description: string
  kind: MarketplacePostKind
  nature: MarketplaceNature
  category: string
  status: MarketplacePostStatus
  createdAt: Date
  housingUnitId: string
  housingUnitCode: string
  postedByName: string
  postedById: string
  claimedByName: string | null
  claimedById: string | null
  /**
   * Present ONLY when the reader is entitled to it — the poster, the person
   * who claimed, or staff. Everyone else gets null, and the field is dropped
   * from the row before it leaves this module rather than hidden in the JSX:
   * the payload is the leak, not the markup.
   */
  contactNote: string | null
  hiddenByStaff: boolean
  hiddenReason: string | null
}

function parseKind(value: FormDataEntryValue | null): MarketplacePostKind | null {
  return typeof value === 'string' && (MARKETPLACE_KIND_VALUES as string[]).includes(value)
    ? (value as MarketplacePostKind)
    : null
}

function parseCategory(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && MARKETPLACE_CATEGORY_VALUES.includes(value) ? value : 'OTHER'
}

function revalidateMarketplace() {
  revalidatePath('/portal/marketplace')
  revalidatePath('/marketplace')
}

const POST_INCLUDE = {
  housingUnit: { select: { id: true, code: true } },
  postedBy: { select: RESIDENT_NAME_SELECT },
  claimedBy: { select: RESIDENT_NAME_SELECT },
} as const

/**
 * The board as one reader sees it.
 *
 * `own` is everything from your own unit — including what is already claimed or
 * closed, because that is your household's own record. `open` is what the rest
 * of the site currently has going, filtered to OPEN: another unit's finished
 * giveaway from three weeks ago is not something you can act on, and a list you
 * cannot act on is a list you stop reading.
 */
export async function listPortalMarketplacePosts(nature?: MarketplaceNature): Promise<{
  own: MarketplacePostSummary[]
  open: MarketplacePostSummary[]
} | null> {
  const auth = await getPortalAuth()
  if (!auth) return null

  const rows = await prisma.marketplacePost.findMany({
    where: { hiddenByStaff: false },
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  const mine = auth.resident.id
  const unitId = auth.placement.housingUnitId
  const mapped = rows
    .map((row) =>
      mapPost(row, {
        // Contact details reach the two people the handover is between, and
        // nobody else. Computed here, once, from the reader's identity.
        canSeeContact: row.postedById === mine || row.claimedById === mine,
      }),
    )
    .filter((post) => !nature || post.nature === nature)

  return {
    own: mapped.filter((post) => post.housingUnitId === unitId),
    open: mapped.filter((post) => post.housingUnitId !== unitId && post.status === 'OPEN'),
  }
}

/**
 * What the reader themselves has posted — for the portal dashboard.
 *
 * The board works end to end and tells nobody anything: someone claims your
 * wardrobe and you find out only if you happen to reopen the marketplace,
 * because there is no notification, no email, and the dashboard did not
 * mention the marketplace at all. `contactNote` — the entire mechanism by
 * which two people who matched arrange the handover — therefore sat on a page
 * nobody was sent to.
 *
 * Closed posts are excluded: a finished giveaway is not something the reader
 * has to do anything about, and a dashboard card is for what is still open.
 */
export async function listMyMarketplacePosts(): Promise<MarketplacePostSummary[]> {
  const auth = await getPortalAuth()
  if (!auth) return []

  const rows = await prisma.marketplacePost.findMany({
    where: {
      postedById: auth.resident.id,
      hiddenByStaff: false,
      status: { in: ['OPEN', 'CLAIMED'] },
    },
    include: POST_INCLUDE,
    // Claimed first: a post someone answered is the one needing the reader's
    // attention, and it is what this card exists to surface.
    orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
  })

  return rows.map((row) => mapPost(row, { canSeeContact: true }))
}

export async function listStaffMarketplacePosts(): Promise<MarketplacePostSummary[]> {
  const rows = await prisma.marketplacePost.findMany({
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  // Staff moderate the board, so they read it whole — that is the job.
  return rows.map((row) => mapPost(row, { canSeeContact: true }))
}

function mapPost(
  row: {
    id: string
    title: string
    description: string
    kind: MarketplacePostKind
    category: string
    status: MarketplacePostStatus
    createdAt: Date
    contactNote: string | null
    hiddenByStaff: boolean
    hiddenReason: string | null
    housingUnit: { id: string; code: string }
    postedBy: { code: string; displayName: string | null }
    claimedBy: { code: string; displayName: string | null } | null
    postedById: string
    claimedById: string | null
  },
  viewer: { canSeeContact: boolean },
): MarketplacePostSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    nature: natureOfKind(row.kind),
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    housingUnitId: row.housingUnit.id,
    housingUnitCode: row.housingUnit.code,
    postedByName: residentName(row.postedBy),
    postedById: row.postedById,
    claimedByName: row.claimedBy ? residentName(row.claimedBy) : null,
    claimedById: row.claimedById,
    contactNote: viewer.canSeeContact ? row.contactNote : null,
    hiddenByStaff: row.hiddenByStaff,
    hiddenReason: row.hiddenReason,
  }
}

export async function createMarketplacePost(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const contactNote = String(formData.get('contactNote') || '').trim() || null
  const kind = parseKind(formData.get('kind'))
  if (!title || !description || !kind) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  // A furniture category on an offer to translate a letter is not a cosmetic
  // mismatch — it is a row that filters into the wrong half of the board
  // forever, and nothing downstream would ever notice. Fall back rather than
  // reject: the person wrote a real post, and losing it to a dropdown would be
  // the worse outcome.
  const requested = parseCategory(formData.get('category'))
  const category = categoryFitsKind(kind, requested) ? requested : 'OTHER'

  await prisma.marketplacePost.create({
    data: {
      housingUnitId: auth.placement.housingUnitId,
      postedById: auth.resident.id,
      title,
      description,
      contactNote,
      kind,
      category,
    },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function claimMarketplacePost(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post || post.status !== 'OPEN' || post.hiddenByStaff) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  // You cannot answer your own advertisement. Nothing stopped this before, and
  // the result was a post marked "Übernommen von <the person who wrote it>" —
  // off the open list, unreachable by the person who might actually have
  // wanted it, and impossible to tell apart from a real match.
  if (post.postedById === auth.resident.id) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  // Conditional on still being OPEN, so two people pressing at once produces
  // one winner rather than a silent overwrite of the first claim.
  const claimed = await prisma.marketplacePost.updateMany({
    where: { id, status: 'OPEN' },
    data: { status: 'CLAIMED', claimedById: auth.resident.id, claimedAt: new Date() },
  })
  if (claimed.count === 0) {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }

  revalidateMarketplace()
  return { success: true }
}

/**
 * The claimer changes their mind.
 *
 * Without this the only way out of a claim was to CLOSE it, which takes the
 * item off the board entirely — so one person's second thoughts destroyed the
 * offer for everybody. Releasing puts it back where it was.
 */
export async function releaseMarketplaceClaim(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post || post.status !== 'CLAIMED') {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  // The poster may also release — a claimer who never turned up should not be
  // able to hold an item hostage indefinitely.
  const mayRelease = post.claimedById === auth.resident.id || post.postedById === auth.resident.id
  if (!mayRelease) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  await prisma.marketplacePost.update({
    where: { id },
    data: { status: 'OPEN', claimedById: null, claimedAt: null },
  })

  revalidateMarketplace()
  return { success: true }
}

export async function closeMarketplacePost(
  formData: FormData,
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

/** The handover fell through, or the thing came back. Poster only. */
export async function reopenMarketplacePost(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post || post.status === 'OPEN') {
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
  if (post.postedById !== auth.resident.id) {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  await prisma.marketplacePost.update({
    where: { id },
    data: { status: 'OPEN', claimedById: null, claimedAt: null, closedAt: null },
  })

  revalidateMarketplace()
  return { success: true }
}

/**
 * Withdraw a post entirely. Poster only, and only while nobody has claimed it.
 *
 * Deleting a post somebody has already answered would erase their side of an
 * arrangement without telling them, so a claimed post can only be closed.
 */
export async function deleteMarketplacePost(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getPortalAuth()
  if (!auth) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }

  const id = String(formData.get('id') || '')
  const post = await prisma.marketplacePost.findUnique({ where: { id } })
  if (!post) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  if (post.postedById !== auth.resident.id || post.status !== 'OPEN') {
    return { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS }
  }

  await prisma.marketplacePost.delete({ where: { id } })

  revalidateMarketplace()
  return { success: true }
}

export async function hideMarketplacePost(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user, 'marketplace:moderate')) {
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
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }
  if (!hasPermission(user, 'marketplace:moderate')) {
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
