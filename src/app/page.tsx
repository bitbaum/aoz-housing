import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  AGE_RANGE_LABELS,
  GENDER_LABELS_SHORT,
  PAGE_TITLES,
  ACTION_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  formatRelativeDate,
  getTrendColorClass,
  getConflictIndicatorClass,
  getSeverityBorderClass,
  type TrendType,
} from '@/lib/utils'
import { StatCard, CardLink } from '@/components/ui/Card'
import { HealthIndicator } from '@/components/ui/ScoreIndicator'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Fetch all data in parallel
  const [residents, units, placements, incidents, recentIncidents] = await Promise.all([
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
    }),
    prisma.housingUnit.findMany({
      include: {
        placements: { where: { status: 'ACTIVE' } },
        incidents: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            category: 'INTERPERSONAL',
          },
        },
      },
    }),
    prisma.placement.findMany({
      where: { status: 'ACTIVE' },
      include: { resident: true, housingUnit: true },
    }),
    prisma.incident.findMany({
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.incident.findMany({
      where: {
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        housingUnit: true,
        reportedBy: true,
        subject: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  // Calculate stats
  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)
  const occupiedBeds = placements.length
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const interpersonalIncidents = incidents.filter(i => i.category === 'INTERPERSONAL')
  const maintenanceIncidents = incidents.filter(i => i.category === 'MAINTENANCE')
  const openIncidents = incidents.filter(i => !i.resolvedAt)

  // Calculate average compatibility
  const avgCompatibility = placements.length > 0
    ? Math.round(
        placements.reduce((sum, p) => sum + (p.compatibilityScore || 0), 0) /
        placements.filter(p => p.compatibilityScore).length || 0
      )
    : 0

  // Find units needing attention (low harmony or many conflicts)
  const unitsNeedingAttention = units
    .filter(u => u.incidents.length >= 2 || u.placements.length >= u.totalBeds)
    .sort((a, b) => b.incidents.length - a.incidents.length)
    .slice(0, 5)

  // Residents waiting for placement
  const unplacedResidents = residents.filter(r => r.status === 'ACTIVE')

  // Determine urgent actions
  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' && !i.resolvedAt)
  const hasUrgentActions = unplacedResidents.length > 0 || criticalIncidents.length > 0

  return (
    <div>
      {/* Urgent Actions Banner */}
      {hasUrgentActions && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h2 className="font-semibold text-orange-800 mb-2">Handlungsbedarf</h2>
          <div className="flex flex-wrap gap-4">
            {unplacedResidents.length > 0 && (
              <Link
                href="/matching"
                className="flex items-center gap-2 text-sm text-orange-700 hover:text-orange-900"
              >
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                {unplacedResidents.length} Bewohner warten auf Platzierung
                <span className="text-orange-400">→</span>
              </Link>
            )}
            {criticalIncidents.length > 0 && (
              <Link
                href="/incidents"
                className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {criticalIncidents.length} kritische Vorfälle offen
                <span className="text-red-400">→</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{PAGE_TITLES.dashboard}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Übersicht vom {new Date().toLocaleDateString('de-CH')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/residents/new" className="btn-primary">
            {ACTION_LABELS.newResident}
          </Link>
          <Link href="/incidents/new" className="btn-outline">
            {ACTION_LABELS.newIncident}
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Bewohner"
          value={residents.length}
          subtitle={`${unplacedResidents.length} warten auf Platzierung`}
          trend={unplacedResidents.length > 5 ? 'warning' : 'neutral'}
          href="/residents"
          tooltip="Aktive Bewohner im System (Status ACTIVE oder PLACED). Klicken für Details."
        />
        <MetricCard
          title="Belegung"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} / ${totalBeds} Plätze`}
          trend={occupancyRate > 90 ? 'warning' : occupancyRate > 70 ? 'neutral' : 'good'}
          href="/housing"
          tooltip="Prozent der belegten Plätze. Über 90% = Warnung (wenig Flexibilität). Berechnet aus aktiven Platzierungen / Gesamtbetten."
        />
        <MetricCard
          title="Ø Kompatibilität"
          value={avgCompatibility > 0 ? `${avgCompatibility}%` : '--'}
          subtitle="Aktive Platzierungen"
          trend={avgCompatibility >= 70 ? 'good' : avgCompatibility >= 50 ? 'neutral' : 'warning'}
          href="/analytics"
          tooltip="Durchschnittliche Kompatibilitätsbewertung aller aktiven Platzierungen. Über 70% = gut, unter 50% = Handlungsbedarf."
        />
        <MetricCard
          title="Offene Vorfälle"
          value={openIncidents.length}
          subtitle={`${interpersonalIncidents.length} Konflikte, ${maintenanceIncidents.length} Wartung`}
          trend={openIncidents.length > 10 ? 'warning' : 'neutral'}
          href="/incidents"
          tooltip="Ungelöste Vorfälle der letzten 30 Tage. Über 10 = Warnung. Konflikte = zwischenmenschlich, Wartung = technisch."
        />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Systemgesundheit</h2>
            <span className="text-xs text-gray-400" title="Werte von 0-100. Höher = besser. Berechnet aus echten Daten der letzten 30 Tage.">
              ⓘ
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <HealthIndicator
              label="Harmonie"
              score={calculateSystemHarmony(units)}
              description={`${units.reduce((sum, u) => sum + u.incidents.length, 0)} Konflikte in ${units.length} Einheiten`}
              tooltip="100 = keine Konflikte. -25 Punkte pro durchschnittlichem Konflikt pro Einheit (letzte 30 Tage). Unter 60: Vermittlung prüfen."
            />
            <HealthIndicator
              label="Kapazität"
              score={100 - occupancyRate}
              description={`${totalBeds - occupiedBeds} von ${totalBeds} Plätzen frei`}
              tooltip="100 = alle Plätze frei, 0 = voll belegt. Unter 20: Neue Unterkünfte suchen."
            />
            <HealthIndicator
              label="Wartung"
              score={calculateMaintenanceHealth(maintenanceIncidents)}
              description={`${maintenanceIncidents.filter(i => !i.resolvedAt).length} offene Meldungen`}
              tooltip="100 = keine offenen Wartungsmeldungen. -10 Punkte pro offener Meldung. Unter 60: Priorität auf Reparaturen."
            />
          </div>
          {/* Color legend */}
          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> 80-100
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> 60-79
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> 40-59
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> 0-39
            </span>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
          <div className="space-y-2">
            <QuickAction
              href="/matching"
              icon="🎯"
              title="Matching starten"
              description="Bewohner platzieren"
            />
            <QuickAction
              href="/housing/new"
              icon="🏠"
              title="Unterkunft hinzufügen"
              description="Neue Einheit erfassen"
            />
            <QuickAction
              href="/analytics"
              icon="📊"
              title="Berichte"
              description="Auswertungen anzeigen"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units Needing Attention */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Unterkünfte mit Handlungsbedarf
            </h2>
            <Link href="/housing" className="text-sm text-aoz-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>

          {unitsNeedingAttention.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-3xl mb-2 block">✓</span>
              Alle Unterkünfte in Ordnung
            </div>
          ) : (
            <div className="space-y-3">
              {unitsNeedingAttention.map((unit) => (
                <Link
                  key={unit.id}
                  href={`/housing/${unit.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getConflictIndicatorClass(unit.incidents.length)}`} />
                    <div>
                      <p className="font-medium text-gray-900">{unit.code}</p>
                      <p className="text-sm text-gray-500">{unit.address}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-900">{unit.incidents.length} Konflikte</p>
                    <p className="text-gray-500">
                      {unit.placements.length}/{unit.totalBeds} belegt
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Letzte Vorfälle
            </h2>
            <Link href="/incidents" className="text-sm text-aoz-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Vorfälle in den letzten 7 Tagen
            </div>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-3 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(incident.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {incident.housingUnit.code}
                        {incident.subject && ` • ${incident.subject.code}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatRelativeDate(incident.date)}
                      </p>
                      {!incident.resolvedAt && (
                        <span className="badge badge-pending text-xs">Offen</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Placements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Warten auf Platzierung
            </h2>
            <Link href="/matching" className="text-sm text-aoz-primary hover:underline">
              Matching starten
            </Link>
          </div>

          {unplacedResidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Alle Bewohner sind platziert
            </div>
          ) : (
            <div className="space-y-3">
              {unplacedResidents.slice(0, 5).map((resident) => (
                <Link
                  key={resident.id}
                  href={`/residents/${resident.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {resident.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{resident.code}</p>
                      <p className="text-sm text-gray-500">
                        {getLabel(AGE_RANGE_LABELS, resident.ageRange)} • {getLabel(GENDER_LABELS_SHORT, resident.gender)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Seit {new Date(resident.createdAt).toLocaleDateString('de-CH')}
                  </span>
                </Link>
              ))}
              {unplacedResidents.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{unplacedResidents.length - 5} weitere
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats by Unit Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kapazitätsübersicht
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Verfügbar', count: units.filter(u => u.status === 'AVAILABLE').length, color: 'bg-green-500' },
              { label: 'Voll belegt', count: units.filter(u => u.status === 'FULL').length, color: 'bg-yellow-500' },
              { label: 'In Wartung', count: units.filter(u => u.status === 'MAINTENANCE').length, color: 'bg-orange-500' },
              { label: 'Geschlossen', count: units.filter(u => u.status === 'CLOSED').length, color: 'bg-gray-400' },
            ].map((status) => (
              <div key={status.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <span className="text-sm text-gray-600">{status.label}</span>
                </div>
                <span className="font-medium text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Components

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  href,
  tooltip,
}: {
  title: string
  value: string | number
  subtitle: string
  trend: TrendType
  href: string
  tooltip?: string
}) {
  return (
    <Link href={href} className="card-hover" title={tooltip}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      <p className={`text-sm mt-2 ${getTrendColorClass(trend)}`}>{subtitle}</p>
    </Link>
  )
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  )
}

// Utility functions

function calculateSystemHarmony(units: any[]): number {
  if (units.length === 0) return 100
  const totalConflicts = units.reduce((sum, u) => sum + u.incidents.length, 0)
  const avgConflicts = totalConflicts / units.length
  return Math.max(0, Math.round(100 - avgConflicts * 25))
}

function calculateMaintenanceHealth(incidents: any[]): number {
  const openCount = incidents.filter(i => !i.resolvedAt).length
  return Math.max(0, 100 - openCount * 10)
}

