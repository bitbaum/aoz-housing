/**
 * Maps each StaffRole to the CareRoleId they primarily work in.
 * ADMIN is excluded — they have no single domain.
 *
 * Used by ClientBoard to show role-contextual card content,
 * and by the residents page to fetch the right care attributes.
 */

import type { StaffRole } from '@/lib/auth/role-policy'
import type { CareRoleId } from '@/lib/config/care'

export const ROLE_DOMAIN: Partial<Record<StaffRole, CareRoleId>> = {
  BETREUUNG: 'HOUSING',
  SOZIALARBEIT: 'SOCIAL',
  JOBCOACH: 'JOB',
  FREIWILLIGENARBEIT: 'VOLUNTEERING',
}
