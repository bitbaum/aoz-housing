import { residentInitials, residentName, type NamedResident } from '@/lib/utils/resident-name'

interface ResidentAvatarProps {
  resident: NamedResident & { id: string }
  /** Photo updatedAt; doubles as the cache-buster. Null/undefined = initials. */
  photoVersion?: Date | string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASS = { sm: 'avatar-sm', md: 'avatar', lg: 'avatar-lg' } as const

/**
 * SSOT for rendering a resident visually: photo when they chose one,
 * initials from their self-chosen name (or code tail) otherwise.
 */
export function ResidentAvatar({ resident, photoVersion, size = 'md' }: ResidentAvatarProps) {
  if (photoVersion) {
    const version = new Date(photoVersion).getTime()
    return (
      // eslint-disable-next-line @next/next/no-img-element -- auth-gated dynamic API image; next/image optimization would re-fetch without the session cookie
      <img
        src={`/api/portal/residents/${resident.id}/photo?v=${version}`}
        alt={residentName(resident)}
        className={`${SIZE_CLASS[size]} object-cover`}
      />
    )
  }
  return (
    <div className={`${SIZE_CLASS[size]} bg-brand-secondary`} aria-hidden="true">
      {residentInitials(resident)}
    </div>
  )
}
