/**
 * Email module barrel export
 */

export { sendEmail, notifyStaff } from './service'
export {
  incidentFollowUpReminder,
  checkInReminder,
  lowSatisfactionAlert,
  newTransferRequestNotification,
  newIncidentNotification,
} from './templates'
export { EMAIL_CONFIG } from './config'
