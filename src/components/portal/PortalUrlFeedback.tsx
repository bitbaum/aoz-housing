'use client'

import { UrlFeedbackToast } from '@/components/ui/UrlFeedbackToast'
import { CHORE_LABELS } from '@/lib/config/household-tasks'
import { useT } from '@/lib/i18n/LocaleProvider'

/** Portal-wide URL feedback — errors from redirects and success after chore create. */
export function PortalUrlFeedback() {
  const t = useT()

  return (
    <UrlFeedbackToast
      success={[{ param: 'created', message: CHORE_LABELS.success.created }]}
      errors={[
        { code: 'account_not_found', message: t('error.accountNotFound') },
      ]}
    />
  )
}
