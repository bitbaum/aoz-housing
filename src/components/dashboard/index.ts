/**
 * The staff dashboard.
 *
 * `ActionDashboard` is what `app/(admin)/page.tsx` renders; the rest are the
 * pieces it and the workspace states are built from.
 *
 * This file used to carry a "Legacy components (kept for backward
 * compatibility)" section holding TaskSection, OccupancyCard, MaintenanceCard
 * and SystemHealth. Nothing imported them — an app has no external callers to
 * be backward compatible WITH — but each still had a full test file, so ~72
 * tests were passing on markup no user could reach. They are deleted rather
 * than re-exported: a green test on a dead component is worse than no test,
 * because the suite is what we point at when asking whether the product works.
 */

export { DashboardMetrics } from './DashboardMetrics'
export { ConflictCard } from './ConflictCard'
export { ActionDashboard } from './ActionDashboard'
