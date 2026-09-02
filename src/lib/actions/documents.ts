'use server'

import { revalidatePath } from 'next/cache'
import { db, resident as residentTable, residentDocument, residentDocumentBlob } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
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
  residentId: string,
): Promise<ResidentDocumentSummary[]> {
  await requirePermission('documents:read')

  const rows = await db.query.residentDocument.findMany({
    where: eq(residentDocument.residentId, residentId),
    columns: {
      id: true,
      category: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    with: { uploadedBy: { columns: { name: true } } },
    orderBy: [desc(residentDocument.createdAt)],
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
  formData: FormData,
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

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.id, residentId),
    columns: { id: true },
  })
  if (!resident) return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }

  const title = String(formData.get('title') || '').trim() || file.name

  try {
    const bytes = Buffer.from(await file.arrayBuffer())

    const created = await db.transaction(async (tx) => {
      const [document] = await tx
        .insert(residentDocument)
        .values({
          residentId,
          category,
          title: title.slice(0, 200),
          fileName: file.name.slice(0, 200),
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedByUserId: user.id,
        })
        .returning()
      await tx.insert(residentDocumentBlob).values({ documentId: document.id, data: bytes })
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
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('documents:write')

  const id = String(formData.get('id') || '')
  const document = await db.query.residentDocument.findFirst({
    where: eq(residentDocument.id, id),
    columns: { id: true, residentId: true, fileName: true, category: true },
  })
  if (!document) return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }

  try {
    // The blob cascades. Deleting the metadata row and orphaning bytes would
    // leave a file nobody can see and nobody can remove.
    await db.delete(residentDocument).where(eq(residentDocument.id, id))

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
