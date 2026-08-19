'use client'

import { useRef, useState, useTransition } from 'react'
import { resizeImageToDataUrl } from '@/lib/image-resize'
import { uploadProductImageAction, deleteProductImageAction } from '@/lib/actions/products'

interface ImageUploadFieldProps {
  /** Existing image to show, if any (the live serving URL). */
  currentImageUrl?: string
  /**
   * If set, a chosen photo uploads immediately (editing an existing
   * product). If unset, the resized photo is only handed to the parent via
   * onChange — the caller bundles it into the product-creation request.
   */
  productId?: string
  onChange?: (dataUrl: string | null) => void
}

export function ImageUploadField({ currentImageUrl, productId, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleFile(file: File) {
    setError('')
    startTransition(async () => {
      let dataUrl: string
      try {
        dataUrl = await resizeImageToDataUrl(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not use that photo.')
        return
      }
      setPreview(dataUrl)
      onChange?.(dataUrl)

      if (productId) {
        const formData = new FormData()
        formData.set('imageDataUrl', dataUrl)
        const result = await uploadProductImageAction(productId, {}, formData)
        if (result.error) setError(result.error)
      }
    })
  }

  function remove() {
    setPreview(null)
    onChange?.(null)
    if (productId) {
      startTransition(async () => {
        const result = await deleteProductImageAction(productId)
        if (result.error) setError(result.error)
      })
    }
  }

  return (
    <div>
      <p className="label-field">Photo</p>
      <div className="flex items-start gap-4">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-subtle">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl" aria-hidden>
              👟
            </span>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="btn-dark text-sm"
          >
            {pending ? 'Uploading…' : preview ? 'Choose a different photo' : 'Upload a photo'}
          </button>
          {preview && (
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="ml-2 min-h-[44px] text-sm text-muted underline hover:text-error-text"
            >
              Remove
            </button>
          )}
          <p className="mt-2 text-xs text-muted">JPEG, PNG or WebP. Resized automatically.</p>
          {error && <p className="mt-1 text-sm font-medium text-error-text">{error}</p>}
        </div>
      </div>
    </div>
  )
}
