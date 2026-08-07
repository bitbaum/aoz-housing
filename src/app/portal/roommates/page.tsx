import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mitbewohner' }
import { getScoreLevel, DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { SCORE_TOKENS } from '@/lib/config/ui-tokens'
import {
  AGE_RANGE_LABELS,
  SLEEP_SCHEDULE_LABELS,
  SOCIAL_STYLE_LABELS,
  PORTAL_LABELS,
  getLabel,
} from '@/lib/constants/labels'
import { requireResidentCookie } from '@/lib/portal-auth'
import type { Resident, CompatibilityAssessment } from '@prisma/client'

type RoommateResident = Pick<Resident, 'id' | 'code' | 'ageRange' | 'sleepSchedule' | 'socialStyle' | 'smokingStatus' | 'languages'>

export const dynamic = 'force-dynamic'

export default async function RoommatesPage() {
  const residentCode = await requireResidentCookie('/portal')

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          housingUnit: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: {
                  resident: {
                    select: {
                      id: true,
                      code: true,
                      ageRange: true,
                      sleepSchedule: true,
                      socialStyle: true,
                      smokingStatus: true,
                      languages: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  const currentPlacement = resident.placements[0]

  // Handle unplaced residents gracefully
  if (!currentPlacement) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/portal" className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline">
            {PORTAL_LABELS.form.back}
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">{PORTAL_LABELS.pages.roommates}</h1>
        </div>
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">🏠</span>
          <p className="text-ui-muted mb-3">{PORTAL_LABELS.roommates.noPlacement}</p>
          <p className="text-sm text-ui-muted font-medium">{PORTAL_LABELS.roommates.noPlacementContact}</p>
        </div>
      </div>
    )
  }

  const housingUnit = currentPlacement.housingUnit
  const roommates = housingUnit.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident)

  // Get compatibility scores with roommates
  const compatibilityScores = roommates.length > 0
    ? await prisma.compatibilityAssessment.findMany({
        where: {
          OR: [
            { residentId: resident.id, comparedWithId: { in: roommates.map(r => r.id) } },
            { residentId: { in: roommates.map(r => r.id) }, comparedWithId: resident.id },
          ],
        },
        select: {
          residentId: true,
          comparedWithId: true,
          overallScore: true,
          strengths: true,
          concerns: true,
        },
      })
    : []

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-brand-primary hover:underline">
          {PORTAL_LABELS.form.back}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-ui-text mt-2">{PORTAL_LABELS.pages.roommates}</h1>
        <p className="text-ui-muted">
          {roommates.length === 0
            ? PORTAL_LABELS.roommates.noRoommates
            : PORTAL_LABELS.roommates.roommateCount(roommates.length)
          }
        </p>
      </div>

      {roommates.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">🏠</span>
          <p className="text-ui-muted">{PORTAL_LABELS.roommates.aloneMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roommates.map((roommate) => {
            const assessment = compatibilityScores.find(
              s => s.residentId === roommate.id || s.comparedWithId === roommate.id
            )
            return (
              <RoommateCard
                key={roommate.id}
                roommate={roommate}
                assessment={assessment}
              />
            )
          })}
        </div>
      )}

      {/* Tips for Living Together */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {PORTAL_LABELS.roommates.tipsTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PORTAL_LABELS.roommates.tips.map((tip, i) => (
            <TipCard key={i} icon={tip.icon} title={tip.title} description={tip.desc} />
          ))}
        </div>
      </div>

      {/* Conflict Resolution */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-ui-text mb-4">
          {PORTAL_LABELS.roommates.conflictTitle}
        </h2>
        <div className="space-y-3 text-sm text-ui-muted">
          {PORTAL_LABELS.roommates.conflictSteps.map((step, i) => (
            <p key={i}>
              <strong>{i + 1}. </strong>{step}
            </p>
          ))}
          <p>
            <strong>{PORTAL_LABELS.roommates.conflictSteps.length + 1}. </strong>{PORTAL_LABELS.roommates.conflictReport}{' '}
            {/* Underlined at rest, not only on hover: inside a text block colour
                alone is not a sufficient cue (WCAG 1.4.1 / axe link-in-text-block). */}
            <Link href="/portal/report" className="inline-flex items-center py-2 -my-2 text-brand-primary underline">
              {PORTAL_LABELS.roommates.conflictReportLink}
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

function RoommateCard({
  roommate,
  assessment,
}: {
  roommate: RoommateResident
  assessment?: Pick<CompatibilityAssessment, 'overallScore' | 'strengths' | 'concerns'>
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="avatar h-16 w-16 bg-brand-secondary text-xl">
          {roommate.code.slice(-3)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-ui-text">{roommate.code}</h3>
              <p className="text-sm text-ui-muted">
                {getLabel(AGE_RANGE_LABELS, roommate.ageRange)} {PORTAL_LABELS.roommates.ageYears}
              </p>
            </div>
            {assessment && (
              <CompatibilityIndicator score={assessment.overallScore} />
            )}
          </div>

          {/* Lifestyle Preview */}
          <div className="mt-4 flex flex-wrap gap-2">
            <LifestyleTag
              icon="🌙"
              label={getLabel(SLEEP_SCHEDULE_LABELS, roommate.sleepSchedule)}
            />
            <LifestyleTag
              icon="👤"
              label={getLabel(SOCIAL_STYLE_LABELS, roommate.socialStyle)}
            />
            {roommate.smokingStatus !== 'NON_SMOKER' && (
              <LifestyleTag icon="🚬" label={PORTAL_LABELS.roommates.isSmoker} />
            )}
            {roommate.languages.length > 0 && (
              <LifestyleTag
                icon="💬"
                label={roommate.languages.slice(0, DISPLAY_LIMITS.languagePreview).join(', ')}
              />
            )}
          </div>

          {/* Compatibility Insights — only render sections that have content */}
          {assessment && (assessment.strengths.length > 0 || assessment.concerns.length > 0) && (
            <div className="mt-4 pt-4 border-t border-ui-border">
              <div className={`grid gap-4 text-sm ${assessment.concerns.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {assessment.strengths.length > 0 && (
                  <div>
                    <p className="text-ui-muted">{PORTAL_LABELS.roommates.strengths}</p>
                    <ul className="mt-1 space-y-1">
                      {assessment.strengths.slice(0, 2).map((s: string, i: number) => (
                        <li key={i} className="text-status-success-text">✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.concerns.length > 0 && (
                  <div>
                    <p className="text-ui-muted">{PORTAL_LABELS.roommates.concerns}</p>
                    <ul className="mt-1 space-y-1">
                      {assessment.concerns.slice(0, 2).map((c: string, i: number) => (
                        <li key={i} className="text-status-warning-text">! {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompatibilityIndicator({ score }: { score: number }) {
  const level = getScoreLevel(score)
  const tokens = SCORE_TOKENS[level]

  return (
    <div className="text-right">
      <div className="flex items-center gap-2 justify-end">
        <div className={`w-3 h-3 rounded-full ${tokens.bg}`} />
        <span className={`font-medium ${tokens.text}`}>{PORTAL_LABELS.roommates.scoreLevels[level]}</span>
      </div>
      <p className="text-xs text-ui-muted mt-1">{score}% {PORTAL_LABELS.roommates.compatible}</p>
    </div>
  )
}

function LifestyleTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-ui-subtle rounded-sm text-xs text-ui-muted">
      {icon} {label}
    </span>
  )
}

function TipCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-ui-subtle rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-medium text-ui-text">{title}</h3>
        <p className="text-sm text-ui-muted">{description}</p>
      </div>
    </div>
  )
}
