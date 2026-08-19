import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PORTAL_LABELS } from '@/lib/constants'
import { ProfileForm } from '@/components/portal/ProfileForm'
import { PhotoUploader } from '@/components/portal/PhotoUploader'
import { getRequestTranslator } from '@/lib/i18n/request'
import { getCareTeam, listUpcomingResidentAppointments } from '@/lib/actions/care'
import { CareTeamCard } from '@/components/residents/CareTeamCard'
import { PortalAppointmentsCard } from '@/components/portal/PortalAppointmentsCard'

export const metadata: Metadata = { title: PORTAL_LABELS.profile.title }
export const dynamic = 'force-dynamic'

const L = PORTAL_LABELS.profile

export default async function PortalProfilePage() {
  const residentCode = await requireResidentCookie('/login')
  const { t } = await getRequestTranslator()

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: {
      id: true,
      code: true,
      displayName: true,
      bio: true,
      profileVisibility: true,
      photo: { select: { updatedAt: true } },
    },
  })
  if (!resident) redirect('/login')
  const [careSeats, upcomingAppointments] = await Promise.all([
    getCareTeam(resident.id),
    listUpcomingResidentAppointments(resident.id),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{L.title}</h1>
        <p className="text-ui-muted mt-1">{L.subtitle}</p>
      </div>

      <div className="card mb-6">
        <p className="eyebrow">{L.codeLabel}</p>
        {/* This card IS the login code. resident-code-intentional */}
        <p className="numeric text-lg text-ui-text mt-1">{resident.code}</p>
        <p className="text-sm text-ui-muted mt-1">{L.codeHint}</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-ui-text mb-1">{L.photoLabel}</h2>
        <p className="text-sm text-ui-muted mb-4">{L.photoHint}</p>
        <PhotoUploader
          resident={{ id: resident.id, code: resident.code, displayName: resident.displayName }}
          photoVersion={resident.photo?.updatedAt?.toISOString() ?? null}
        />
      </div>

      <div className="mb-6">
        <CareTeamCard
          seats={careSeats}
          title={t('care.title')}
          subtitle={t('care.subtitle')}
          empty={t('care.empty')}
          unassigned={t('care.unassigned')}
          roleLabels={{
            HOUSING: t('care.housing'),
            SOCIAL: t('care.social'),
            JOB: t('care.job'),
            VOLUNTEERING: t('care.volunteering'),
          }}
        />
      </div>

      <div className="mb-6">
        <PortalAppointmentsCard
          title={t('care.appointments')}
          empty={t('care.appointmentsEmpty')}
          appointments={upcomingAppointments}
          roleLabels={{
            HOUSING: t('care.housing'),
            SOCIAL: t('care.social'),
            JOB: t('care.job'),
            VOLUNTEERING: t('care.volunteering'),
          }}
        />
      </div>

      <div className="card">
        <ProfileForm
          displayName={resident.displayName ?? ''}
          bio={resident.bio ?? ''}
          profileVisibility={resident.profileVisibility}
        />
        <p className="text-xs text-ui-muted mt-4">{L.visibleTo}</p>
      </div>
    </div>
  )
}
