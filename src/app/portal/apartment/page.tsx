import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getPortalAuth } from '@/lib/portal-auth'
import { PORTAL_LABELS } from '@/lib/constants'
import { ResidentAvatar } from '@/components/portal/ResidentAvatar'
import { ApartmentNameEditor } from '@/components/portal/ApartmentNameEditor'
import { residentName } from '@/lib/utils/resident-name'
import Link from 'next/link'

export const metadata: Metadata = { title: PORTAL_LABELS.apartment.title }
export const dynamic = 'force-dynamic'

const L = PORTAL_LABELS.apartment

interface Occupant {
  id: string
  code: string
  displayName: string | null
  bio: string | null
  photoVersion: Date | null
}

export default async function PortalApartmentPage() {
  const auth = await getPortalAuth()
  if (!auth) redirect('/login')

  const unit = await prisma.housingUnit.findUnique({
    where: { id: auth.placement.housingUnitId },
    select: {
      id: true,
      code: true,
      address: true,
      nickname: true,
      quietHours: true,
      spots: {
        where: { parentSpotId: null },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          label: true,
          capacity: true,
          placements: {
            where: { status: 'ACTIVE' },
            select: { residentId: true },
          },
          childSpots: {
            orderBy: { code: 'asc' },
            select: {
              id: true,
              placements: {
                where: { status: 'ACTIVE' },
                select: { residentId: true },
              },
            },
          },
        },
      },
      placements: {
        where: { status: 'ACTIVE' },
        select: {
          resident: {
            select: {
              id: true,
              code: true,
              displayName: true,
              bio: true,
              photo: { select: { updatedAt: true } },
            },
          },
        },
      },
    },
  })
  if (!unit) redirect('/portal')

  const occupants: Occupant[] = unit.placements.map((p) => ({
    id: p.resident.id,
    code: p.resident.code,
    displayName: p.resident.displayName,
    bio: p.resident.bio,
    photoVersion: p.resident.photo?.updatedAt ?? null,
  }))
  const occupantById = new Map(occupants.map((o) => [o.id, o]))

  const rooms = unit.spots.map((spot) => {
    const occupantIds = [
      ...spot.placements.map((p) => p.residentId),
      ...spot.childSpots.flatMap((bed) => bed.placements.map((p) => p.residentId)),
    ]
    const capacity = spot.childSpots.length > 0 ? spot.childSpots.length : spot.capacity
    return {
      id: spot.id,
      name: spot.label || `${L.roomFallback} ${spot.code}`,
      capacity,
      occupants: occupantIds
        .map((id) => occupantById.get(id))
        .filter((o): o is Occupant => Boolean(o)),
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{L.title}</h1>
        <p className="text-ui-muted mt-1">{L.subtitle}</p>
      </div>

      {/* Identity card: resident-chosen name + address */}
      <div className="card mb-6">
        <ApartmentNameEditor nickname={unit.nickname} />
        <div className="mt-4 pt-4 border-t border-ui-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="eyebrow">{L.address}</p>
            <p className="text-ui-text mt-1">{unit.address}</p>
          </div>
          {unit.quietHours && (
            <div>
              <p className="eyebrow">{L.quietHours}</p>
              <p className="text-ui-text mt-1 numeric">{unit.quietHours}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rooms */}
      {rooms.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-ui-text mb-4">{L.roomsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="border border-ui-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-ui-text">{room.name}</p>
                  <span className="text-xs text-ui-muted numeric">
                    {room.occupants.length}/{room.capacity}
                  </span>
                </div>
                <div className="space-y-2">
                  {room.occupants.map((occupant) => (
                    <div key={occupant.id} className="flex items-center gap-2">
                      <ResidentAvatar resident={occupant} photoVersion={occupant.photoVersion} size="sm" />
                      <span className="text-sm text-ui-text truncate">
                        {residentName(occupant)}
                      </span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, room.capacity - room.occupants.length) }).map(
                    (_, i) => (
                      <p key={i} className="text-sm text-ui-muted">
                        {L.freeBed}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Residents */}
      <div className="card">
        <h2 className="text-lg font-semibold text-ui-text mb-4">{L.residentsTitle}</h2>
        <div className="space-y-4">
          {occupants.map((occupant) => (
            <div key={occupant.id} className="flex items-start gap-3">
              <ResidentAvatar resident={occupant} photoVersion={occupant.photoVersion} size="lg" />
              <div className="min-w-0">
                <p className="font-medium text-ui-text">
                  {residentName(occupant)}
                  {occupant.id === auth.resident.id && (
                    <Link
                      href="/portal/profile"
                      className="ms-2 text-sm font-normal text-brand-primary hover:underline"
                    >
                      {PORTAL_LABELS.nav.profile}
                    </Link>
                  )}
                </p>
                {occupant.bio && <p className="text-sm text-ui-muted mt-0.5">{occupant.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
