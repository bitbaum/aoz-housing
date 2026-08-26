/**
 * Product image decoding — a single boundary for the base64 data URL the
 * browser sends after resizing a photo client-side.
 */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB decoded

export class ImageError extends Error {}

export function decodeDataUrl(dataUrl: string): { data: Buffer; mimeType: string } {
  const match = /^data:(image\/[a-z]+);base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new ImageError('That does not look like an image file.')
  const [, mimeType, base64] = match
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageError('Please use a JPEG, PNG or WebP photo.')
  }
  const data = Buffer.from(base64, 'base64')
  if (data.length === 0) throw new ImageError('The image appears to be empty.')
  if (data.length > MAX_BYTES) {
    throw new ImageError('That photo is too large — please choose a smaller one.')
  }
  return { data, mimeType }
}
