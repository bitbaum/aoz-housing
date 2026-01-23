export { endPlacement, transferPlacement } from './placements'
export { createResident, updateResident } from './residents'
export { createHousingUnit, updateHousingUnit } from './housing'
export {
  createCheckInFromForm,
  getPlacementCheckIns,
  getPlacementSatisfactionTrend,
} from './satisfaction'
export {
  createIncident,
  resolveIncident,
  getResidentIncidentStats,
  getHousingUnitIncidentHistory,
  addFollowUp,
  getIncidentWithFollowUps,
  getIncidentsNeedingFollowUp,
  clearFollowUpReminder,
} from './incidents'
export {
  createSpot,
  updateSpot,
  deleteSpot,
  createMultipleSpots,
} from './spots'
export {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  assignMaintenanceRequest,
  getMaintenanceStats,
  getHousingUnitMaintenance,
} from './maintenance'
