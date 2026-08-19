import { getRequestTranslator } from '@/lib/i18n/request'
import { formatDate } from '@/lib/utils'
import type { MessageKey } from '@/lib/i18n'

interface OpenMaintenanceRequest {
  id: string
  category: string
  createdAt: Date
}

interface PortalMaintenanceCardProps {
  requests: OpenMaintenanceRequest[]
}

const MAINTENANCE_CATEGORY_KEYS: Record<string, MessageKey> = {
  PLUMBING: 'maintenanceCategory.PLUMBING',
  ELECTRICAL: 'maintenanceCategory.ELECTRICAL',
  HEATING_COOLING: 'maintenanceCategory.HEATING_COOLING',
  APPLIANCE: 'maintenanceCategory.APPLIANCE',
  STRUCTURAL: 'maintenanceCategory.STRUCTURAL',
  PEST_CONTROL: 'maintenanceCategory.PEST_CONTROL',
  SECURITY: 'maintenanceCategory.SECURITY',
  CLEANING: 'maintenanceCategory.CLEANING',
  EXTERIOR: 'maintenanceCategory.EXTERIOR',
  OTHER: 'maintenanceCategory.OTHER',
}

export async function PortalMaintenanceCard({ requests }: PortalMaintenanceCardProps) {
  const { t } = await getRequestTranslator()

  return (
    <div className="card md:col-span-2">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {t('dashboard.openMaintenance')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-status-warning/10 rounded-lg"
          >
            <span className="text-xl">🔧</span>
            <div>
              <p className="font-medium text-ui-text text-sm">
                {MAINTENANCE_CATEGORY_KEYS[request.category]
                  ? t(MAINTENANCE_CATEGORY_KEYS[request.category])
                  : t('maintenanceCategory.OTHER')}
              </p>
              <p className="text-sm text-ui-muted">
                {t('dashboard.reported')}: {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
