import { INCIDENT_PAGE_LABELS } from '@/lib/constants/labels/incidents'
import {
  RESIDENT_DETAIL_LABELS,
  HOUSING_SPOTS_LABELS,
  INCIDENT_DETAIL_LABELS,
} from '@/lib/constants/labels/ui'

export type AdminFeedbackKind = 'success' | 'error'

/** Staff UI: pathname + query param → toast message (German SSOT). */
export interface AdminUrlFeedbackRule {
  pathPattern: RegExp
  param: string
  message: string
  kind: AdminFeedbackKind
}

export const ADMIN_URL_FEEDBACK_RULES: AdminUrlFeedbackRule[] = [
  {
    pathPattern: /^\/incidents\/[^/]+$/,
    param: 'created',
    message: INCIDENT_PAGE_LABELS.createdToast,
    kind: 'success',
  },
  {
    pathPattern: /^\/incidents\/[^/]+$/,
    param: 'resolved',
    message: INCIDENT_DETAIL_LABELS.markedResolved,
    kind: 'success',
  },
  {
    pathPattern: /^\/housing\/[^/]+\/spots$/,
    param: 'created',
    message: HOUSING_SPOTS_LABELS.toastCreated,
    kind: 'success',
  },
  {
    pathPattern: /^\/housing\/[^/]+\/spots$/,
    param: 'createdMultiple',
    message: HOUSING_SPOTS_LABELS.toastCreatedMultiple,
    kind: 'success',
  },
  {
    pathPattern: /^\/housing\/[^/]+\/spots$/,
    param: 'updated',
    message: HOUSING_SPOTS_LABELS.toastUpdated,
    kind: 'success',
  },
  {
    pathPattern: /^\/housing\/[^/]+\/spots$/,
    param: 'deleted',
    message: HOUSING_SPOTS_LABELS.toastDeleted,
    kind: 'success',
  },
  {
    pathPattern: /^\/residents\/[^/]+$/,
    param: 'placed',
    message: RESIDENT_DETAIL_LABELS.toastPlaced,
    kind: 'success',
  },
  {
    pathPattern: /^\/residents\/[^/]+$/,
    param: 'checkin',
    message: RESIDENT_DETAIL_LABELS.toastCheckin,
    kind: 'success',
  },
  {
    pathPattern: /^\/residents\/[^/]+$/,
    param: 'transferred',
    message: RESIDENT_DETAIL_LABELS.toastTransferred,
    kind: 'success',
  },
  {
    pathPattern: /^\/residents\/[^/]+$/,
    param: 'ended',
    message: RESIDENT_DETAIL_LABELS.toastEnded,
    kind: 'success',
  },
]
