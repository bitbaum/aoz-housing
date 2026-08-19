'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PHOTO_LIMITS } from '@/lib/config/profile'
import { ResidentAvatar } from '@/components/portal/ResidentAvatar'
import { useT } from '@/lib/i18n/LocaleProvider'

const L = PORTAL_LABELS.profile

interface PhotoUploaderProps {
  resident: { id: string; code: string; displayName: string | null }
  photoVersion: string | null
}

/**
 * Any phone photo works: the image is resized in the browser (canvas) down
 * to the configured avatar dimension before upload, so the payload always
 * fits the server-side byte cap.
 */
async function resizeToAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, PHOTO_LIMITS.clientMaxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas 2d context unavailable')
    context.drawImage(bitmap, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        PHOTO_LIMITS.clientJpegQuality
      )
    })
  } finally {
    bitmap.close()
  }
}

export function PhotoUploader({ resident, photoVersion }: PhotoUploaderProps) {
  const router = useRouter()
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setBusy(true)
    try {
      const blob = await resizeToAvatar(file)
      const formData = new FormData()
      formData.append('photo', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))

      const response = await fetch('/api/portal/profile/photo', { method: 'POST', body: formData })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || t('error.generic'))
        return
      }
      router.push('/portal/profile?photoUpdated=true')
    } catch {
      setError(t('error.generic'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    setError(null)
    setBusy(true)
    try {
      const response = await fetch('/api/portal/profile/photo', { method: 'DELETE' })
      const body = await response.json()
      if (!body.success) {
        setError(body.error || t('error.generic'))
        return
      }
      router.push('/portal/profile?photoRemoved=true')
    } catch {
      setError(t('error.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <ResidentAvatar resident={resident} photoVersion={photoVersion} size="lg" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-outline"
          >
            {busy ? t('action.saving') : L.photoUpload}
          </button>
          {photoVersion && (
            <button type="button" onClick={handleRemove} disabled={busy} className="btn-ghost">
              {L.photoRemove}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_LIMITS.allowedMimeTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label={L.photoUpload}
      />
      {error && (
        <div role="alert" className="alert-error mt-3">
          {error}
        </div>
      )}
    </div>
  )
}
