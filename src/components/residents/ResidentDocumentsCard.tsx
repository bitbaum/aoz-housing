import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_LABELS,
  DOCUMENT_MIME_TYPES,
} from '@/lib/config/documents'
import {
  deleteResidentDocument,
  uploadResidentDocument,
  type ResidentDocumentSummary,
} from '@/lib/actions/documents'
import { formatDate } from '@/lib/utils'

interface ResidentDocumentsCardProps {
  residentId: string
  documents: ResidentDocumentSummary[]
  canWrite: boolean
}

/** Whole kilobytes below a megabyte; one decimal above. */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Career documents on a client's file.
 *
 * The reason this exists: a job coach could open a profile, read the job
 * attributes and write learning records, but had nowhere to put the one
 * artefact the work is actually about — the CV. It went in an email, or a
 * shared drive, or nowhere.
 */
export function ResidentDocumentsCard({
  residentId,
  documents,
  canWrite,
}: ResidentDocumentsCardProps) {
  async function submitUpload(formData: FormData): Promise<void> {
    'use server'
    await uploadResidentDocument(formData)
  }

  async function submitDelete(formData: FormData): Promise<void> {
    'use server'
    await deleteResidentDocument(formData)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text">{DOCUMENT_LABELS.title}</h2>
      <p className="text-sm text-ui-muted mt-1 mb-4">{DOCUMENT_LABELS.subtitle}</p>

      {documents.length === 0 ? (
        <p className="text-sm text-ui-muted">{DOCUMENT_LABELS.empty}</p>
      ) : (
        <ul className="space-y-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-start justify-between gap-3 border border-ui-border rounded-md p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-ui-text break-words">{document.title}</p>
                <p className="text-xs text-ui-muted mt-0.5">
                  <span className="chip chip-neutral mr-2">
                    {DOCUMENT_CATEGORY_LABELS[document.category]}
                  </span>
                  <span className="numeric">{formatSize(document.sizeBytes)}</span>
                  {' · '}
                  {formatDate(document.createdAt)}
                  {document.uploadedByName
                    ? ` · ${DOCUMENT_LABELS.uploadedBy}: ${document.uploadedByName}`
                    : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/residents/${residentId}/documents/${document.id}`}
                  className="btn-outline min-h-[44px] text-sm inline-flex items-center"
                >
                  {DOCUMENT_LABELS.download}
                </a>
                {canWrite && (
                  <form action={submitDelete}>
                    <input type="hidden" name="id" value={document.id} />
                    <button type="submit" className="btn-ghost min-h-[44px] text-sm">
                      {DOCUMENT_LABELS.remove}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <details className="mt-4">
          <summary className="btn-secondary inline-flex min-h-[44px] cursor-pointer items-center text-sm list-none [&::-webkit-details-marker]:hidden">
            {DOCUMENT_LABELS.add}
          </summary>
          <form action={submitUpload} className="mt-3 space-y-3">
            <input type="hidden" name="residentId" value={residentId} />

            <div>
              <label htmlFor="document-title" className="label">
                {DOCUMENT_LABELS.titleLabel}
              </label>
              <input id="document-title" name="title" maxLength={200} className="input" />
            </div>

            <div>
              <label htmlFor="document-category" className="label">
                {DOCUMENT_LABELS.categoryLabel}
              </label>
              <select id="document-category" name="category" className="input" defaultValue="CV">
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {DOCUMENT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="document-file" className="label">
                {DOCUMENT_LABELS.fileLabel}
              </label>
              <input
                id="document-file"
                name="file"
                type="file"
                required
                // A hint to the file picker, never the check. The size and type
                // are both enforced again on the server, because a request can
                // be made without ever meeting this input.
                accept={Object.keys(DOCUMENT_MIME_TYPES).join(',')}
                className="input"
              />
              <p className="text-xs text-ui-muted mt-1">{DOCUMENT_LABELS.limitHint}</p>
            </div>

            <button type="submit" className="btn-primary min-h-[44px] text-sm">
              {DOCUMENT_LABELS.upload}
            </button>
          </form>
        </details>
      )}
    </div>
  )
}
