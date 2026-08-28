/**
 * Translated names for the opportunity enums.
 *
 * The staff side reads the German labels straight out of
 * `lib/config/opportunities.ts` and that is right — staff UI is German by
 * decision. The portal is not: the three things a resident needs from this
 * page are what kind of work it is, whether a permit stands between them and
 * it, and where their own application stands. Leaving those in German would
 * translate the page around the only parts that carry the information.
 *
 * The maps are keyed by the config's own id unions, so adding a stage or a
 * permit state fails to compile here until it has a key — the same parity the
 * German labels get from being declared in the config itself.
 */

import type { MessageKey } from './dictionaries/de'
import type { Translator } from './index'
import type {
  ApplicationStageId,
  OpportunityKindId,
  PermitRequirementId,
} from '@/lib/config/opportunities'

const KIND_KEYS: Record<OpportunityKindId, MessageKey> = {
  VOLUNTEERING: 'opportunities.kindVolunteering',
  COMMUNITY_SERVICE: 'opportunities.kindCommunity',
  EMPLOYMENT: 'opportunities.kindEmployment',
  INTERNSHIP: 'opportunities.kindInternship',
}

const PERMIT_KEYS: Record<PermitRequirementId, MessageKey> = {
  NONE: 'opportunities.permitNone',
  EMPLOYER_NOTIFIES: 'opportunities.permitNotifies',
  PERMIT_REQUIRED: 'opportunities.permitRequired',
}

const STAGE_KEYS: Record<ApplicationStageId, MessageKey> = {
  INTERESTED: 'opportunities.stageInterested',
  APPLIED: 'opportunities.stageApplied',
  INTERVIEW: 'opportunities.stageInterview',
  ACCEPTED: 'opportunities.stageAccepted',
  STARTED: 'opportunities.stageStarted',
  ENDED: 'opportunities.stageEnded',
  DECLINED: 'opportunities.stageDeclined',
}

export function opportunityKindLabel(t: Translator, kind: OpportunityKindId): string {
  return t(KIND_KEYS[kind])
}

export function permitRequirementLabel(t: Translator, permit: PermitRequirementId): string {
  return t(PERMIT_KEYS[permit])
}

export function applicationStageLabel(t: Translator, stage: ApplicationStageId): string {
  return t(STAGE_KEYS[stage])
}
