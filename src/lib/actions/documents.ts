'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  DOCUMENT_LABELS,
  DOCUMENT_MAX_BYTES,
  isAllowedDocumentType,
  isDocumentCategory,
  type DocumentCategoryId,
} from '@/lib/config/documents'

export type ResidentDocumentSummary = {
  id: string
  category: DocumentCategoryId
  title: string
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
  uploadedByName: string | null
}

/**
 * The documents on one resident's file.
 *
 * Selects explicitly and never touches the blob table — the bytes live in
 * `ResidentDocumentBlob` precisely so a list of titles cannot accidentally
 * become a list of megabytes.
 */
export async function listResidentDocuments(
  residentId: string
): Promise<ResidentDocumentSummary[]> {
  await requirePermission('documents:read')

  const rows = await prisma.residentDocument.findMany({
    where: { residentId },
    select: {
      id: true,
      category: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    category: (isDocumentCategory(row.category) ? row.category : 'OTHER') as DocumentCategoryId,
    title: row.title,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    uploadedByName: row.uploadedBy?.name ?? null,
  }))
}

export async function uploadResidentDocument(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('documents:write')

  const residentId = String(formData.get('residentId') || '')
  const rawCategory = String(formData.get('category') || 'OTHER')
  const category: DocumentCategoryId = isDocumentCategory(rawCategory) ? rawCategory : 'OTHER'
  const file = formData.get('file')

  if (!residentId) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: DOCUMENT_LABELS.missingFile }
  }

  // Both checks are server-side on purpose. `accept` on the input and a size
  // check in the browser are hints to a cooperating user, not a boundary — the
  // request can be made without either.
  if (file.size > DOCUMENT_MAX_BYTES) {
    return { success: false, error: DOCUMENT_LABELS.tooLarge }
  }
  if (!isAllowedDocumentType(file.type)) {
    return { success: false, error: DOCUMENT_LABELS.wrongType }
  }

  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    select: { id: true },
  })
  if (!resident) return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }

  const title = String(formData.get('title') || '').trim() || file.name

  try {
    const bytes = Buffer.from(await file.arrayBuffer())

    const created = await prisma.$transaction(async (tx) => {
      const document = await tx.residentDocument.create({
        data: {
          residentId,
          category,
          title: title.slice(0, 200),
          fileName: file.name.slice(0, 200),
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedByUserId: user.id,
        },
      })
      await tx.residentDocumentBlob.create({
        data: { documentId: document.id, data: bytes },
      })
      return document
    })

    await logAudit({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      // The filename is recorded; the contents never are. An audit log is not
      // a second copy of the document.
      changes: {
        type: 'DOCUMENT_UPLOAD',
        documentId: created.id,
        category,
        fileName: created.fileName,
        sizeBytes: file.size,
      },
    })

    revalidatePath(`/residents/${residentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to store resident document', error, { residentId })
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
}

export async function deleteResidentDocument(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('documents:write')

  const id = String(formData.get('id') || '')
  const document = await prisma.residentDocument.findUnique({
    where: { id },
    select: { id: true, residentId: true, fileName: true, category: true },
  })
  if (!document) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  try {
    // The blob cascades. Deleting the metadata row and orphaning bytes would
    // leave a file nobody can see and nobody can remove.
    await prisma.residentDocument.delete({ where: { id } })

    await logAudit({
      action: 'DELETE',
      entity: 'RESIDENT',
      entityId: document.residentId,
      userId: user.id,
      changes: {
        type: 'DOCUMENT_DELETE',
        documentId: id,
        category: document.category,
        fileName: document.fileName,
      },
    })

    revalidatePath(`/residents/${document.residentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to delete resident document', error, { id })
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
}
