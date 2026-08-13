/**
 * Resident self-profile and apartment-profile configuration — SSOT
 *
 * Everything here is OPTIONAL self-disclosure: the login code stays the
 * identity; a resident who never sets a name or photo loses nothing.
 */

export const PROFILE_LIMITS = {
  maxDisplayNameLength: 40,
  maxBioLength: 400,
  /** Resident-chosen apartment name, e.g. "Singapur". */
  maxNicknameLength: 40,
} as const

export const PHOTO_LIMITS = {
  /** Server-side hard cap on the stored image. */
  maxBytes: 512 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  /** Client-side resize target (longest edge) before upload. */
  clientMaxDimension: 512,
  clientJpegQuality: 0.85,
} as const

export type AllowedPhotoMimeType = (typeof PHOTO_LIMITS.allowedMimeTypes)[number]

export function isAllowedPhotoMimeType(mimeType: string): boolean {
  return (PHOTO_LIMITS.allowedMimeTypes as readonly string[]).includes(mimeType)
}
