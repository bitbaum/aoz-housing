CREATE TYPE "public"."ActivityCategory" AS ENUM('SPORT', 'LANGUAGE', 'CULTURE', 'COMMUNITY', 'FAMILY', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."ActivityCost" AS ENUM('FREE', 'REDUCED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."ActivityStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."AgeRange" AS ENUM('YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR');--> statement-breakpoint
CREATE TYPE "public"."AgreementStatus" AS ENUM('PROPOSED', 'ACCEPTED', 'HELD', 'BROKEN', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."ApplicationStage" AS ENUM('INTERESTED', 'APPLIED', 'INTERVIEW', 'ACCEPTED', 'STARTED', 'ENDED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."AppointmentStatus" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."AuthTokenPurpose" AS ENUM('VERIFY_EMAIL', 'RESET_PASSWORD');--> statement-breakpoint
CREATE TYPE "public"."CareRole" AS ENUM('HOUSING', 'SOCIAL', 'JOB', 'VOLUNTEERING');--> statement-breakpoint
CREATE TYPE "public"."CheckInType" AS ENUM('INITIAL', 'REGULAR', 'AD_HOC', 'EXIT');--> statement-breakpoint
CREATE TYPE "public"."ComplaintStatus" AS ENUM('OPEN', 'IN_REVIEW', 'ANSWERED');--> statement-breakpoint
CREATE TYPE "public"."ComplaintSubject" AS ENUM('STAFF', 'ACCOMMODATION', 'DECISION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ConflictStyle" AS ENUM('AVOIDANT', 'COOPERATIVE', 'DIRECT');--> statement-breakpoint
CREATE TYPE "public"."DecisionMode" AS ENUM('RESIDENT_BINDING', 'RESIDENT_ADVISORY', 'STAFF_ONLY');--> statement-breakpoint
CREATE TYPE "public"."EndReason" AS ENUM('NATURAL', 'CONFLICT', 'REQUEST', 'CAPACITY', 'UPGRADE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."EventRsvpStatus" AS ENUM('GOING', 'MAYBE', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."FamilyStatus" AS ENUM('SINGLE', 'COUPLE', 'FAMILY_WITH_CHILDREN', 'SINGLE_PARENT');--> statement-breakpoint
CREATE TYPE "public"."FollowUpPriority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."Gender" AS ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY');--> statement-breakpoint
CREATE TYPE "public"."HouseEventCategory" AS ENUM('HOUSE_MEETING', 'SOCIAL', 'CULTURE', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."HouseEventStatus" AS ENUM('DRAFT', 'PUBLISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."HouseholdTaskCategory" AS ENUM('CLEANING', 'SHOPPING', 'MAINTENANCE', 'COOKING', 'TRASH', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."HouseholdTaskPriority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."HouseholdTaskStatus" AS ENUM('IDLE', 'NEEDS_ATTENTION', 'REQUESTED', 'IN_PROGRESS');--> statement-breakpoint
CREATE TYPE "public"."HouseholdTaskType" AS ENUM('ONE_TIME', 'RECURRING_SCHEDULED', 'RECURRING_AS_NEEDED');--> statement-breakpoint
CREATE TYPE "public"."HousingStatus" AS ENUM('AVAILABLE', 'FULL', 'MAINTENANCE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."IncidentCategory" AS ENUM('INTERPERSONAL', 'MAINTENANCE', 'SAFETY', 'WELLBEING');--> statement-breakpoint
CREATE TYPE "public"."IncidentSeverity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."IncidentType" AS ENUM('NOISE_COMPLAINT', 'CLEANLINESS_DISPUTE', 'PERSONAL_CONFLICT', 'CULTURAL_FRICTION', 'SPACE_DISPUTE', 'SCHEDULE_CONFLICT', 'SAFETY_CONCERN', 'PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'SECURITY_SYSTEM', 'GENERAL_MAINTENANCE', 'LOW_SATISFACTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."InvolvementRole" AS ENUM('INVOLVED', 'WITNESS', 'MEDIATOR');--> statement-breakpoint
CREATE TYPE "public"."LearningKind" AS ENUM('LANGUAGE_TEST', 'COURSE', 'INFORMAL', 'QUALIFICATION', 'VOLUNTEERING', 'COMMUNITY_SERVICE', 'EMPLOYMENT', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."LearningStatus" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."LivingSkillsSupport" AS ENUM('INDEPENDENT', 'SOME_SUPPORT', 'REGULAR_SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."MaintenanceCategory" AS ENUM('PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'SECURITY', 'CLEANING', 'EXTERIOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."MaintenancePriority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."MaintenanceStatus" AS ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."MarketplacePostKind" AS ENUM('GIVE_AWAY', 'LEND', 'WANTED', 'OFFER_HELP', 'NEED_HELP');--> statement-breakpoint
CREATE TYPE "public"."MarketplacePostStatus" AS ENUM('OPEN', 'CLAIMED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."MedicalDocType" AS ENUM('PRIVATE_ROOM', 'STUDIO', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."MobilityNeed" AS ENUM('NONE', 'GROUND_FLOOR', 'WHEELCHAIR');--> statement-breakpoint
CREATE TYPE "public"."OpportunityKind" AS ENUM('VOLUNTEERING', 'COMMUNITY_SERVICE', 'EMPLOYMENT', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."OpportunityStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."PermitRequirement" AS ENUM('NONE', 'EMPLOYER_NOTIFIES', 'PERMIT_REQUIRED');--> statement-breakpoint
CREATE TYPE "public"."PlacementStatus" AS ENUM('ACTIVE', 'ENDED', 'TRANSFERRED');--> statement-breakpoint
CREATE TYPE "public"."ProfileVisibility" AS ENUM('PRIVATE', 'ROOMMATES', 'RESIDENTS');--> statement-breakpoint
CREATE TYPE "public"."ProposalStatus" AS ENUM('DISCUSSION', 'VOTING', 'NEEDS_STAFF_CONFIRMATION', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'VETOED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."ProposalType" AS ENUM('ADD_RULE', 'AMEND_RULE', 'REPEAL_RULE', 'HOUSE_DECISION');--> statement-breakpoint
CREATE TYPE "public"."RecyclingKnowledge" AS ENUM('NONE', 'BASIC', 'GOOD');--> statement-breakpoint
CREATE TYPE "public"."ResidentOrStaff" AS ENUM('RESIDENT', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."ResidentStatus" AS ENUM('ACTIVE', 'PLACED', 'TRANSFERRED', 'EXITED');--> statement-breakpoint
CREATE TYPE "public"."ResolutionStage" AS ENUM('REPORTED', 'SELF_RESOLUTION', 'PEER_MEDIATION', 'STAFF_MEDIATION', 'FORMAL_MEASURE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."RoomSharingStatus" AS ENUM('CAN_SHARE', 'PREFERS_PRIVATE', 'NEEDS_PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."RuleCategory" AS ENUM('SAFETY', 'RESPECT', 'NOISE', 'CLEANLINESS', 'KITCHEN', 'BATHROOM', 'GUESTS', 'SHARED_SPACES', 'COSTS', 'COMMUNICATION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."RuleDelegation" AS ENUM('FIXED', 'UNIT_MAY_STRENGTHEN', 'UNIT_DECIDES');--> statement-breakpoint
CREATE TYPE "public"."RuleScope" AS ENUM('ORG', 'UNIT');--> statement-breakpoint
CREATE TYPE "public"."RuleStatus" AS ENUM('ACTIVE', 'SUPERSEDED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."SleepSchedule" AS ENUM('EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'IRREGULAR');--> statement-breakpoint
CREATE TYPE "public"."SmokingStatus" AS ENUM('NON_SMOKER', 'OUTDOOR_SMOKER', 'INDOOR_SMOKER');--> statement-breakpoint
CREATE TYPE "public"."SocialStyle" AS ENUM('INTROVERTED', 'MODERATE', 'EXTROVERTED');--> statement-breakpoint
CREATE TYPE "public"."SpotStatus" AS ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."SpotType" AS ENUM('BED', 'PRIVATE_ROOM', 'STUDIO', 'ROOM');--> statement-breakpoint
CREATE TYPE "public"."StaffDecision" AS ENUM('CONFIRMED', 'VETOED');--> statement-breakpoint
CREATE TYPE "public"."StaffRole" AS ENUM('ADMIN', 'BETREUUNG', 'SOZIALARBEIT', 'JOBCOACH', 'FREIWILLIGENARBEIT');--> statement-breakpoint
CREATE TYPE "public"."StaffScope" AS ENUM('OWN_DOMAIN', 'ALL_DOMAINS');--> statement-breakpoint
CREATE TYPE "public"."SupportLevel" AS ENUM('STANDARD', 'ELEVATED', 'INTENSIVE');--> statement-breakpoint
CREATE TYPE "public"."TaskRequestStatus" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."TransferRequestStatus" AS ENUM('PENDING', 'APPROVED', 'DENIED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."VoteChoice" AS ENUM('YES', 'NO', 'ABSTAIN', 'BLOCK');--> statement-breakpoint
CREATE TYPE "public"."VoteThreshold" AS ENUM('CONSENSUS', 'SUPERMAJORITY', 'SIMPLE_MAJORITY');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text,
	"emailVerifiedAt" timestamp (3),
	"userId" text,
	"residentId" text
);
--> statement-breakpoint
CREATE TABLE "Activity" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "ActivityCategory" NOT NULL,
	"cost" "ActivityCost" DEFAULT 'FREE' NOT NULL,
	"costNote" text,
	"location" text,
	"website" text,
	"phone" text,
	"schedule" text,
	"startsAt" timestamp (3),
	"endsAt" timestamp (3),
	"status" "ActivityStatus" DEFAULT 'DRAFT' NOT NULL,
	"highlight" boolean DEFAULT false NOT NULL,
	"createdByUserId" text,
	"updatedByUserId" text
);
--> statement-breakpoint
CREATE TABLE "AgreementParty" (
	"id" text PRIMARY KEY NOT NULL,
	"agreementId" text NOT NULL,
	"residentId" text NOT NULL,
	"acceptedAt" timestamp (3),
	"declinedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "AlgorithmWeight" (
	"id" text PRIMARY KEY NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"lifestyleWeight" double precision DEFAULT 30 NOT NULL,
	"socialWeight" double precision DEFAULT 25 NOT NULL,
	"practicalWeight" double precision DEFAULT 25 NOT NULL,
	"riskWeight" double precision DEFAULT 20 NOT NULL,
	"factorWeights" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "Appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"staffId" text,
	"domain" "CareRole" NOT NULL,
	"title" text NOT NULL,
	"startsAt" timestamp (3) NOT NULL,
	"endsAt" timestamp (3),
	"location" text,
	"notes" text,
	"status" "AppointmentStatus" DEFAULT 'SCHEDULED' NOT NULL,
	"residentNote" text,
	"staffNote" text
);
--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text NOT NULL,
	"userId" text,
	"changes" jsonb,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "AuthToken" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"tokenHash" text NOT NULL,
	"purpose" "AuthTokenPurpose" NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"usedAt" timestamp (3),
	"accountId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CareAssignment" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"staffId" text NOT NULL,
	"role" "CareRole" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CareAttribute" (
	"id" text PRIMARY KEY NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"domain" "CareRole" NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updatedById" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompatibilityAssessment" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"residentId" text NOT NULL,
	"comparedWithId" text NOT NULL,
	"overallScore" double precision NOT NULL,
	"lifestyleScore" double precision NOT NULL,
	"socialScore" double precision NOT NULL,
	"practicalScore" double precision NOT NULL,
	"riskScore" double precision NOT NULL,
	"strengths" text[],
	"concerns" text[],
	"recommendations" text[]
);
--> statement-breakpoint
CREATE TABLE "Complaint" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text,
	"subject" "ComplaintSubject" NOT NULL,
	"body" text NOT NULL,
	"status" "ComplaintStatus" DEFAULT 'OPEN' NOT NULL,
	"response" text,
	"respondedAt" timestamp (3),
	"respondedByUserId" text
);
--> statement-breakpoint
CREATE TABLE "ConflictAgreement" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"incidentId" text NOT NULL,
	"terms" text NOT NULL,
	"mediatorName" text,
	"reviewDate" timestamp (3) NOT NULL,
	"status" "AgreementStatus" DEFAULT 'PROPOSED' NOT NULL,
	"outcomeNotes" text,
	"reviewedAt" timestamp (3),
	"ruleProposalId" text
);
--> statement-breakpoint
CREATE TABLE "EventRsvp" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"eventId" text NOT NULL,
	"residentId" text NOT NULL,
	"status" "EventRsvpStatus" DEFAULT 'GOING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Expense" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"paidById" text NOT NULL,
	"createdById" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"amountRappen" integer NOT NULL,
	"date" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExpenseShare" (
	"id" text PRIMARY KEY NOT NULL,
	"expenseId" text NOT NULL,
	"residentId" text NOT NULL,
	"amountRappen" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "HouseEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "HouseEventCategory" DEFAULT 'SOCIAL' NOT NULL,
	"location" text,
	"startsAt" timestamp (3) NOT NULL,
	"endsAt" timestamp (3),
	"status" "HouseEventStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"createdByStaffId" text,
	"createdByResidentId" text
);
--> statement-breakpoint
CREATE TABLE "HouseRule" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"scope" "RuleScope" NOT NULL,
	"housingUnitId" text,
	"key" text,
	"category" "RuleCategory" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"delegation" "RuleDelegation" DEFAULT 'FIXED' NOT NULL,
	"parentRuleId" text,
	"status" "RuleStatus" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"effectiveFrom" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"effectiveUntil" timestamp (3),
	"adoptedByProposalId" text,
	"createdByStaff" text
);
--> statement-breakpoint
CREATE TABLE "HouseholdTask" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"taskType" "HouseholdTaskType" DEFAULT 'ONE_TIME' NOT NULL,
	"category" "HouseholdTaskCategory" DEFAULT 'OTHER' NOT NULL,
	"priority" "HouseholdTaskPriority" DEFAULT 'NORMAL' NOT NULL,
	"scheduleHuman" text,
	"estimatedMinutes" integer,
	"currentStatus" "HouseholdTaskStatus" DEFAULT 'IDLE' NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp (3),
	"createdByResidentId" text,
	"createdByStaff" text,
	"checklist" text[] DEFAULT ARRAY[]::TEXT[],
	"rotationResidentIds" text[] DEFAULT ARRAY[]::TEXT[]
);
--> statement-breakpoint
CREATE TABLE "HousingUnit" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"code" text NOT NULL,
	"address" text NOT NULL,
	"totalBeds" integer NOT NULL,
	"totalRooms" integer NOT NULL,
	"sharedRooms" integer NOT NULL,
	"privateRooms" integer NOT NULL,
	"sharedBathrooms" integer NOT NULL,
	"privateBathrooms" integer NOT NULL,
	"sharedKitchen" boolean DEFAULT true NOT NULL,
	"privateKitchen" boolean DEFAULT false NOT NULL,
	"groundFloor" boolean DEFAULT false NOT NULL,
	"wheelchairAccess" boolean DEFAULT false NOT NULL,
	"elevator" boolean DEFAULT false NOT NULL,
	"smokingAllowed" boolean DEFAULT false NOT NULL,
	"petsAllowed" boolean DEFAULT false NOT NULL,
	"quietHours" text,
	"nearPublicTransport" boolean DEFAULT true NOT NULL,
	"nearHealthServices" boolean DEFAULT false NOT NULL,
	"nearSchools" boolean DEFAULT false NOT NULL,
	"status" "HousingStatus" DEFAULT 'AVAILABLE' NOT NULL,
	"notes" text,
	"nickname" text,
	"buildingCode" text
);
--> statement-breakpoint
CREATE TABLE "Incident" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"placementId" text,
	"reportedById" text,
	"subjectId" text,
	"date" timestamp (3) NOT NULL,
	"category" "IncidentCategory" DEFAULT 'INTERPERSONAL' NOT NULL,
	"type" "IncidentType" NOT NULL,
	"severity" "IncidentSeverity" NOT NULL,
	"description" text NOT NULL,
	"resolution" text,
	"resolvedAt" timestamp (3),
	"predictable" boolean,
	"compatibilityGap" text,
	"nextFollowUpDate" timestamp (3),
	"followUpPriority" "FollowUpPriority",
	"mediationMinutes" integer,
	"resolutionStage" "ResolutionStage" DEFAULT 'REPORTED' NOT NULL,
	"stageEnteredAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "IncidentFollowUp" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"incidentId" text NOT NULL,
	"action" text NOT NULL,
	"notes" text,
	"outcome" text,
	"staffName" text,
	"scheduledNextDate" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "IncidentInvolvement" (
	"id" text PRIMARY KEY NOT NULL,
	"incidentId" text NOT NULL,
	"residentId" text NOT NULL,
	"role" "InvolvementRole" DEFAULT 'INVOLVED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LearningRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"kind" "LearningKind" NOT NULL,
	"title" text NOT NULL,
	"status" "LearningStatus" DEFAULT 'PLANNED' NOT NULL,
	"languageCode" text,
	"cefrLevel" text,
	"provider" text,
	"category" text,
	"hours" integer,
	"startedAt" timestamp (3),
	"completedAt" timestamp (3),
	"notes" text,
	"recordedBy" "ResidentOrStaff" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MaintenanceRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"spotId" text,
	"category" "MaintenanceCategory" NOT NULL,
	"priority" "MaintenancePriority" DEFAULT 'NORMAL' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"reportedById" text,
	"reporterName" text,
	"assignedTo" text,
	"assignedAt" timestamp (3),
	"status" "MaintenanceStatus" DEFAULT 'OPEN' NOT NULL,
	"startedAt" timestamp (3),
	"completedAt" timestamp (3),
	"resolution" text,
	"cost" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "MarketplacePost" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"postedById" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"kind" "MarketplacePostKind" NOT NULL,
	"category" text DEFAULT 'OTHER' NOT NULL,
	"status" "MarketplacePostStatus" DEFAULT 'OPEN' NOT NULL,
	"claimedById" text,
	"closedAt" timestamp (3),
	"hiddenByStaff" boolean DEFAULT false NOT NULL,
	"hiddenReason" text,
	"contactNote" text,
	"claimedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"threadId" text NOT NULL,
	"authorResidentId" text,
	"authorUserId" text,
	"body" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"readAt" timestamp (3),
	CONSTRAINT "Message_one_author" CHECK (("authorResidentId" IS NOT NULL) <> ("authorUserId" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "MessageThread" (
	"id" text PRIMARY KEY NOT NULL,
	"residentId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Opportunity" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"kind" "OpportunityKind" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"organisation" text NOT NULL,
	"location" text,
	"schedule" text,
	"hoursPerWeek" integer,
	"seats" integer,
	"germanLevel" text,
	"permitRequirement" "PermitRequirement" DEFAULT 'NONE' NOT NULL,
	"requirementNote" text,
	"contactName" text,
	"contactEmail" text,
	"contactPhone" text,
	"website" text,
	"status" "OpportunityStatus" DEFAULT 'DRAFT' NOT NULL,
	"startsAt" timestamp (3),
	"endsAt" timestamp (3),
	"createdByUserId" text,
	"updatedByUserId" text
);
--> statement-breakpoint
CREATE TABLE "OpportunityApplication" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"opportunityId" text NOT NULL,
	"stage" "ApplicationStage" DEFAULT 'INTERESTED' NOT NULL,
	"stageChangedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"note" text,
	"createdBy" "ResidentOrStaff" NOT NULL,
	"supportedByUserId" text,
	"learningRecordId" text
);
--> statement-breakpoint
CREATE TABLE "Placement" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"housingUnitId" text NOT NULL,
	"spotId" text,
	"startDate" timestamp (3) NOT NULL,
	"endDate" timestamp (3),
	"compatibilityScore" double precision,
	"lifestyleScore" double precision,
	"socialScore" double precision,
	"practicalScore" double precision,
	"riskScore" double precision,
	"status" "PlacementStatus" DEFAULT 'ACTIVE' NOT NULL,
	"endReason" "EndReason",
	"satisfactionRating" integer,
	"placementNotes" text,
	"outcomeNotes" text,
	"conflictGap" text,
	"wasPredictable" boolean,
	"relatedIncidentId" text
);
--> statement-breakpoint
CREATE TABLE "PlacementSpot" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"code" text NOT NULL,
	"label" text,
	"type" "SpotType" NOT NULL,
	"parentSpotId" text,
	"squareMeters" double precision,
	"floor" integer,
	"hasPrivateBathroom" boolean DEFAULT false NOT NULL,
	"hasPrivateKitchen" boolean DEFAULT false NOT NULL,
	"hasPrivateToilet" boolean DEFAULT false NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"requiresMedicalDocs" boolean DEFAULT false NOT NULL,
	"status" "SpotStatus" DEFAULT 'AVAILABLE' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "Proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"housingUnitId" text NOT NULL,
	"type" "ProposalType" NOT NULL,
	"category" "RuleCategory" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"targetRuleId" text,
	"parentOrgRuleId" text,
	"proposedByResidentId" text,
	"proposedByStaff" text,
	"status" "ProposalStatus" DEFAULT 'DISCUSSION' NOT NULL,
	"decisionMode" "DecisionMode" NOT NULL,
	"threshold" "VoteThreshold" NOT NULL,
	"quorumPercent" integer NOT NULL,
	"approvalPercent" integer NOT NULL,
	"eligibleVoterCount" integer DEFAULT 0 NOT NULL,
	"discussionEndsAt" timestamp (3),
	"votingOpenedAt" timestamp (3),
	"votingEndsAt" timestamp (3),
	"decidedAt" timestamp (3),
	"outcomeSummary" text,
	"staffDecision" "StaffDecision",
	"staffNotes" text,
	"staffUserId" text,
	"staffDecidedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Resident" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"code" text NOT NULL,
	"ageRange" "AgeRange" NOT NULL,
	"gender" "Gender" NOT NULL,
	"familyStatus" "FamilyStatus" NOT NULL,
	"sleepSchedule" "SleepSchedule" NOT NULL,
	"noiseTolerance" integer NOT NULL,
	"cleanlinessPractice" integer NOT NULL,
	"guestTolerance" integer DEFAULT 3 NOT NULL,
	"socialStyle" "SocialStyle" NOT NULL,
	"languages" text[],
	"culturalRegion" text,
	"conflictStyle" "ConflictStyle" DEFAULT 'COOPERATIVE' NOT NULL,
	"smokingStatus" "SmokingStatus" NOT NULL,
	"dietaryNeeds" text[],
	"mobilityNeeds" "MobilityNeed" NOT NULL,
	"medicalEquipment" boolean DEFAULT false NOT NULL,
	"petTolerance" boolean DEFAULT true NOT NULL,
	"sharedBathroom" boolean DEFAULT true NOT NULL,
	"sharedKitchen" boolean DEFAULT true NOT NULL,
	"privacyNeed" integer NOT NULL,
	"choresContribution" integer DEFAULT 3 NOT NULL,
	"recyclingKnowledge" "RecyclingKnowledge" DEFAULT 'NONE' NOT NULL,
	"roomSharingStatus" "RoomSharingStatus" DEFAULT 'CAN_SHARE' NOT NULL,
	"hasNightDisturbances" boolean DEFAULT false NOT NULL,
	"needsQuietEnvironment" boolean DEFAULT false NOT NULL,
	"hasSleepEquipment" boolean DEFAULT false NOT NULL,
	"supportLevel" "SupportLevel" DEFAULT 'STANDARD' NOT NULL,
	"roommatePreferences" text,
	"status" "ResidentStatus" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"hasMedicalDocumentation" boolean DEFAULT false NOT NULL,
	"medicalDocType" "MedicalDocType",
	"medicalDocDate" timestamp (3),
	"medicalDocNotes" text,
	"preferencesCompletedAt" timestamp (3),
	"cleanlinessExpectation" integer DEFAULT 3 NOT NULL,
	"chaosTolerance" integer DEFAULT 3 NOT NULL,
	"bio" text,
	"displayName" text,
	"profileVisibility" "ProfileVisibility" DEFAULT 'ROOMMATES' NOT NULL,
	"livingSkillsSupport" "LivingSkillsSupport" DEFAULT 'INDEPENDENT' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ResidentDocument" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"category" text DEFAULT 'OTHER' NOT NULL,
	"title" text NOT NULL,
	"fileName" text NOT NULL,
	"mimeType" text NOT NULL,
	"sizeBytes" integer NOT NULL,
	"uploadedByUserId" text
);
--> statement-breakpoint
CREATE TABLE "ResidentDocumentBlob" (
	"documentId" text PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ResidentPhoto" (
	"residentId" text PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"mimeType" text NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RuleAcknowledgement" (
	"id" text PRIMARY KEY NOT NULL,
	"ruleId" text NOT NULL,
	"residentId" text NOT NULL,
	"ruleVersion" integer NOT NULL,
	"acknowledgedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SatisfactionCheckIn" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"placementId" text NOT NULL,
	"checkInType" "CheckInType" NOT NULL,
	"weekNumber" integer,
	"overallSatisfaction" integer NOT NULL,
	"roommateRelations" integer,
	"facilitySatisfaction" integer,
	"safetyFeeling" integer,
	"concerns" text,
	"improvements" text,
	"positives" text,
	"collectedBy" text,
	"isAnonymous" boolean DEFAULT false NOT NULL,
	"appointmentId" text,
	"collectedByUserId" text
);
--> statement-breakpoint
CREATE TABLE "Settlement" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"housingUnitId" text NOT NULL,
	"fromId" text NOT NULL,
	"toId" text NOT NULL,
	"amountRappen" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "SystemConfig" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"pilotBaselineIncidentsPerMonth" double precision,
	"pilotBaselineRelocationsPerMonth" double precision,
	"pilotBaselineMediationHoursPerWeek" double precision,
	"pilotStartDate" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "TaskAttentionFlag" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"taskId" text NOT NULL,
	"flaggedById" text NOT NULL,
	"message" text,
	"isResolved" boolean DEFAULT false NOT NULL,
	"resolvedAt" timestamp (3),
	"resolvedByCompletionId" text
);
--> statement-breakpoint
CREATE TABLE "TaskCompletion" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"taskId" text NOT NULL,
	"completedById" text NOT NULL,
	"completedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"notes" text,
	"durationMinutes" integer,
	"completedItems" text[] DEFAULT ARRAY[]::TEXT[]
);
--> statement-breakpoint
CREATE TABLE "TaskRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"taskId" text NOT NULL,
	"requestedById" text NOT NULL,
	"requestedResidentId" text,
	"isBroadcast" boolean DEFAULT false NOT NULL,
	"message" text,
	"status" "TaskRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"responseMessage" text,
	"completionId" text
);
--> statement-breakpoint
CREATE TABLE "TransferRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"currentPlacementId" text,
	"targetUnitId" text,
	"reason" text NOT NULL,
	"status" "TransferRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"staffNotes" text,
	"reviewedBy" text,
	"reviewedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"name" text NOT NULL,
	"role" "StaffRole" DEFAULT 'BETREUUNG' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"lastLoginAt" timestamp (3),
	"code" text NOT NULL,
	"scope" "StaffScope" DEFAULT 'OWN_DOMAIN' NOT NULL,
	"isSystemAdmin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "User_code_key" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "Vote" (
	"id" text PRIMARY KEY NOT NULL,
	"proposalId" text NOT NULL,
	"residentId" text NOT NULL,
	"choice" "VoteChoice" NOT NULL,
	"reason" text,
	"castAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementParty" ADD CONSTRAINT "AgreementParty_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."ConflictAgreement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AgreementParty" ADD CONSTRAINT "AgreementParty_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CareAttribute" ADD CONSTRAINT "CareAttribute_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CareAttribute" ADD CONSTRAINT "CareAttribute_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CompatibilityAssessment" ADD CONSTRAINT "CompatibilityAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "CompatibilityAssessment" ADD CONSTRAINT "CompatibilityAssessment_comparedWithId_fkey" FOREIGN KEY ("comparedWithId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ConflictAgreement" ADD CONSTRAINT "ConflictAgreement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ConflictAgreement" ADD CONSTRAINT "ConflictAgreement_ruleProposalId_fkey" FOREIGN KEY ("ruleProposalId") REFERENCES "public"."Proposal"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."HouseEvent"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseEvent" ADD CONSTRAINT "HouseEvent_createdByResidentId_fkey" FOREIGN KEY ("createdByResidentId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_parentRuleId_fkey" FOREIGN KEY ("parentRuleId") REFERENCES "public"."HouseRule"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_adoptedByProposalId_fkey" FOREIGN KEY ("adoptedByProposalId") REFERENCES "public"."Proposal"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseholdTask" ADD CONSTRAINT "HouseholdTask_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "HouseholdTask" ADD CONSTRAINT "HouseholdTask_createdByResidentId_fkey" FOREIGN KEY ("createdByResidentId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "public"."Placement"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "IncidentFollowUp" ADD CONSTRAINT "IncidentFollowUp_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "IncidentInvolvement" ADD CONSTRAINT "IncidentInvolvement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "IncidentInvolvement" ADD CONSTRAINT "IncidentInvolvement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LearningRecord" ADD CONSTRAINT "LearningRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "public"."PlacementSpot"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MarketplacePost" ADD CONSTRAINT "MarketplacePost_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."MessageThread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorResidentId_fkey" FOREIGN KEY ("authorResidentId") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_supportedByUserId_fkey" FOREIGN KEY ("supportedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_learningRecordId_fkey" FOREIGN KEY ("learningRecordId") REFERENCES "public"."LearningRecord"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "public"."PlacementSpot"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_relatedIncidentId_fkey" FOREIGN KEY ("relatedIncidentId") REFERENCES "public"."Incident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PlacementSpot" ADD CONSTRAINT "PlacementSpot_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PlacementSpot" ADD CONSTRAINT "PlacementSpot_parentSpotId_fkey" FOREIGN KEY ("parentSpotId") REFERENCES "public"."PlacementSpot"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_targetRuleId_fkey" FOREIGN KEY ("targetRuleId") REFERENCES "public"."HouseRule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_parentOrgRuleId_fkey" FOREIGN KEY ("parentOrgRuleId") REFERENCES "public"."HouseRule"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_proposedByResidentId_fkey" FOREIGN KEY ("proposedByResidentId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ResidentDocument" ADD CONSTRAINT "ResidentDocument_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ResidentDocument" ADD CONSTRAINT "ResidentDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ResidentDocumentBlob" ADD CONSTRAINT "ResidentDocumentBlob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."ResidentDocument"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ResidentPhoto" ADD CONSTRAINT "ResidentPhoto_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RuleAcknowledgement" ADD CONSTRAINT "RuleAcknowledgement_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."HouseRule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RuleAcknowledgement" ADD CONSTRAINT "RuleAcknowledgement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "public"."Placement"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."Resident"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."HouseholdTask"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_resolvedByCompletionId_fkey" FOREIGN KEY ("resolvedByCompletionId") REFERENCES "public"."TaskCompletion"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."HouseholdTask"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."HouseholdTask"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_requestedResidentId_fkey" FOREIGN KEY ("requestedResidentId") REFERENCES "public"."Resident"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "public"."TaskCompletion"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_currentPlacementId_fkey" FOREIGN KEY ("currentPlacementId") REFERENCES "public"."Placement"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_targetUnitId_fkey" FOREIGN KEY ("targetUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Account_email_key" ON "Account" USING btree ("email");--> statement-breakpoint
CREATE INDEX "Account_residentId_idx" ON "Account" USING btree ("residentId");--> statement-breakpoint
CREATE UNIQUE INDEX "Account_residentId_key" ON "Account" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "Account_userId_idx" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Account_userId_key" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Activity_endsAt_idx" ON "Activity" USING btree ("endsAt");--> statement-breakpoint
CREATE INDEX "Activity_status_category_idx" ON "Activity" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "Activity_status_highlight_idx" ON "Activity" USING btree ("status","highlight");--> statement-breakpoint
CREATE UNIQUE INDEX "AgreementParty_agreementId_residentId_key" ON "AgreementParty" USING btree ("agreementId","residentId");--> statement-breakpoint
CREATE INDEX "AgreementParty_residentId_idx" ON "AgreementParty" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "AlgorithmWeight_active_idx" ON "AlgorithmWeight" USING btree ("active");--> statement-breakpoint
CREATE INDEX "Appointment_residentId_startsAt_idx" ON "Appointment" USING btree ("residentId","startsAt");--> statement-breakpoint
CREATE INDEX "Appointment_staffId_startsAt_idx" ON "Appointment" USING btree ("staffId","startsAt");--> statement-breakpoint
CREATE INDEX "Appointment_status_domain_idx" ON "Appointment" USING btree ("status","domain");--> statement-breakpoint
CREATE INDEX "Appointment_status_idx" ON "Appointment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog" USING btree ("entity","entityId");--> statement-breakpoint
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuthToken_accountId_purpose_idx" ON "AuthToken" USING btree ("accountId","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken" USING btree ("tokenHash");--> statement-breakpoint
CREATE UNIQUE INDEX "CareAssignment_residentId_role_key" ON "CareAssignment" USING btree ("residentId","role");--> statement-breakpoint
CREATE INDEX "CareAssignment_staffId_idx" ON "CareAssignment" USING btree ("staffId");--> statement-breakpoint
CREATE INDEX "CareAttribute_residentId_domain_idx" ON "CareAttribute" USING btree ("residentId","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "CareAttribute_residentId_domain_key_key" ON "CareAttribute" USING btree ("residentId","domain","key");--> statement-breakpoint
CREATE INDEX "CompatibilityAssessment_overallScore_idx" ON "CompatibilityAssessment" USING btree ("overallScore");--> statement-breakpoint
CREATE UNIQUE INDEX "CompatibilityAssessment_residentId_comparedWithId_key" ON "CompatibilityAssessment" USING btree ("residentId","comparedWithId");--> statement-breakpoint
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Complaint_residentId_idx" ON "Complaint" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "Complaint_status_idx" ON "Complaint" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ConflictAgreement_incidentId_idx" ON "ConflictAgreement" USING btree ("incidentId");--> statement-breakpoint
CREATE UNIQUE INDEX "ConflictAgreement_ruleProposalId_key" ON "ConflictAgreement" USING btree ("ruleProposalId");--> statement-breakpoint
CREATE INDEX "ConflictAgreement_status_reviewDate_idx" ON "ConflictAgreement" USING btree ("status","reviewDate");--> statement-breakpoint
CREATE INDEX "EventRsvp_eventId_idx" ON "EventRsvp" USING btree ("eventId");--> statement-breakpoint
CREATE UNIQUE INDEX "EventRsvp_eventId_residentId_key" ON "EventRsvp" USING btree ("eventId","residentId");--> statement-breakpoint
CREATE INDEX "Expense_housingUnitId_date_idx" ON "Expense" USING btree ("housingUnitId","date");--> statement-breakpoint
CREATE UNIQUE INDEX "ExpenseShare_expenseId_residentId_key" ON "ExpenseShare" USING btree ("expenseId","residentId");--> statement-breakpoint
CREATE INDEX "ExpenseShare_residentId_idx" ON "ExpenseShare" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "HouseEvent_housingUnitId_startsAt_idx" ON "HouseEvent" USING btree ("housingUnitId","startsAt");--> statement-breakpoint
CREATE INDEX "HouseEvent_status_startsAt_idx" ON "HouseEvent" USING btree ("status","startsAt");--> statement-breakpoint
CREATE INDEX "HouseRule_category_idx" ON "HouseRule" USING btree ("category");--> statement-breakpoint
CREATE INDEX "HouseRule_housingUnitId_status_idx" ON "HouseRule" USING btree ("housingUnitId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "HouseRule_key_key" ON "HouseRule" USING btree ("key");--> statement-breakpoint
CREATE INDEX "HouseRule_parentRuleId_idx" ON "HouseRule" USING btree ("parentRuleId");--> statement-breakpoint
CREATE INDEX "HouseRule_scope_status_idx" ON "HouseRule" USING btree ("scope","status");--> statement-breakpoint
CREATE INDEX "HouseholdTask_housingUnitId_category_idx" ON "HouseholdTask" USING btree ("housingUnitId","category");--> statement-breakpoint
CREATE INDEX "HouseholdTask_housingUnitId_currentStatus_idx" ON "HouseholdTask" USING btree ("housingUnitId","currentStatus");--> statement-breakpoint
CREATE INDEX "HousingUnit_buildingCode_idx" ON "HousingUnit" USING btree ("buildingCode");--> statement-breakpoint
CREATE UNIQUE INDEX "HousingUnit_code_key" ON "HousingUnit" USING btree ("code");--> statement-breakpoint
CREATE INDEX "HousingUnit_status_idx" ON "HousingUnit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "HousingUnit_totalBeds_idx" ON "HousingUnit" USING btree ("totalBeds");--> statement-breakpoint
CREATE INDEX "Incident_date_idx" ON "Incident" USING btree ("date");--> statement-breakpoint
CREATE INDEX "Incident_nextFollowUpDate_idx" ON "Incident" USING btree ("nextFollowUpDate");--> statement-breakpoint
CREATE INDEX "Incident_reportedById_idx" ON "Incident" USING btree ("reportedById");--> statement-breakpoint
CREATE INDEX "Incident_subjectId_idx" ON "Incident" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "Incident_type_severity_idx" ON "Incident" USING btree ("type","severity");--> statement-breakpoint
CREATE INDEX "IncidentFollowUp_createdAt_idx" ON "IncidentFollowUp" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "IncidentFollowUp_incidentId_idx" ON "IncidentFollowUp" USING btree ("incidentId");--> statement-breakpoint
CREATE UNIQUE INDEX "IncidentInvolvement_incidentId_residentId_key" ON "IncidentInvolvement" USING btree ("incidentId","residentId");--> statement-breakpoint
CREATE INDEX "IncidentInvolvement_residentId_idx" ON "IncidentInvolvement" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "LearningRecord_languageCode_cefrLevel_idx" ON "LearningRecord" USING btree ("languageCode","cefrLevel");--> statement-breakpoint
CREATE INDEX "LearningRecord_residentId_kind_idx" ON "LearningRecord" USING btree ("residentId","kind");--> statement-breakpoint
CREATE INDEX "LearningRecord_status_idx" ON "LearningRecord" USING btree ("status");--> statement-breakpoint
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "MaintenanceRequest_housingUnitId_idx" ON "MaintenanceRequest" USING btree ("housingUnitId");--> statement-breakpoint
CREATE INDEX "MaintenanceRequest_priority_status_idx" ON "MaintenanceRequest" USING btree ("priority","status");--> statement-breakpoint
CREATE INDEX "MaintenanceRequest_reportedById_idx" ON "MaintenanceRequest" USING btree ("reportedById");--> statement-breakpoint
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "MarketplacePost_housingUnitId_status_idx" ON "MarketplacePost" USING btree ("housingUnitId","status");--> statement-breakpoint
CREATE INDEX "MarketplacePost_postedById_idx" ON "MarketplacePost" USING btree ("postedById");--> statement-breakpoint
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message" USING btree ("threadId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "MessageThread_residentId_key" ON "MessageThread" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "MessageThread_updatedAt_idx" ON "MessageThread" USING btree ("updatedAt");--> statement-breakpoint
CREATE INDEX "Opportunity_endsAt_idx" ON "Opportunity" USING btree ("endsAt");--> statement-breakpoint
CREATE INDEX "Opportunity_status_kind_idx" ON "Opportunity" USING btree ("status","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "OpportunityApplication_learningRecordId_key" ON "OpportunityApplication" USING btree ("learningRecordId");--> statement-breakpoint
CREATE INDEX "OpportunityApplication_opportunityId_stage_idx" ON "OpportunityApplication" USING btree ("opportunityId","stage");--> statement-breakpoint
CREATE INDEX "OpportunityApplication_residentId_idx" ON "OpportunityApplication" USING btree ("residentId");--> statement-breakpoint
CREATE UNIQUE INDEX "OpportunityApplication_residentId_opportunityId_key" ON "OpportunityApplication" USING btree ("residentId","opportunityId");--> statement-breakpoint
CREATE INDEX "OpportunityApplication_stage_idx" ON "OpportunityApplication" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "Placement_housingUnitId_idx" ON "Placement" USING btree ("housingUnitId");--> statement-breakpoint
CREATE UNIQUE INDEX "Placement_residentId_housingUnitId_startDate_key" ON "Placement" USING btree ("residentId","housingUnitId","startDate");--> statement-breakpoint
CREATE INDEX "Placement_residentId_idx" ON "Placement" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "Placement_startDate_endDate_idx" ON "Placement" USING btree ("startDate","endDate");--> statement-breakpoint
CREATE INDEX "Placement_status_idx" ON "Placement" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "PlacementSpot_housingUnitId_code_key" ON "PlacementSpot" USING btree ("housingUnitId","code");--> statement-breakpoint
CREATE INDEX "PlacementSpot_housingUnitId_idx" ON "PlacementSpot" USING btree ("housingUnitId");--> statement-breakpoint
CREATE INDEX "PlacementSpot_requiresMedicalDocs_idx" ON "PlacementSpot" USING btree ("requiresMedicalDocs");--> statement-breakpoint
CREATE INDEX "PlacementSpot_type_status_idx" ON "PlacementSpot" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "Proposal_housingUnitId_status_idx" ON "Proposal" USING btree ("housingUnitId","status");--> statement-breakpoint
CREATE INDEX "Proposal_status_votingEndsAt_idx" ON "Proposal" USING btree ("status","votingEndsAt");--> statement-breakpoint
CREATE INDEX "Resident_ageRange_gender_idx" ON "Resident" USING btree ("ageRange","gender");--> statement-breakpoint
CREATE UNIQUE INDEX "Resident_code_key" ON "Resident" USING btree ("code");--> statement-breakpoint
CREATE INDEX "Resident_livingSkillsSupport_idx" ON "Resident" USING btree ("livingSkillsSupport");--> statement-breakpoint
CREATE INDEX "Resident_status_idx" ON "Resident" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ResidentDocument_residentId_createdAt_idx" ON "ResidentDocument" USING btree ("residentId","createdAt");--> statement-breakpoint
CREATE INDEX "RuleAcknowledgement_residentId_idx" ON "RuleAcknowledgement" USING btree ("residentId");--> statement-breakpoint
CREATE UNIQUE INDEX "RuleAcknowledgement_ruleId_residentId_ruleVersion_key" ON "RuleAcknowledgement" USING btree ("ruleId","residentId","ruleVersion");--> statement-breakpoint
CREATE UNIQUE INDEX "SatisfactionCheckIn_appointmentId_key" ON "SatisfactionCheckIn" USING btree ("appointmentId");--> statement-breakpoint
CREATE INDEX "SatisfactionCheckIn_checkInType_idx" ON "SatisfactionCheckIn" USING btree ("checkInType");--> statement-breakpoint
CREATE INDEX "SatisfactionCheckIn_collectedByUserId_idx" ON "SatisfactionCheckIn" USING btree ("collectedByUserId");--> statement-breakpoint
CREATE INDEX "SatisfactionCheckIn_placementId_idx" ON "SatisfactionCheckIn" USING btree ("placementId");--> statement-breakpoint
CREATE INDEX "Settlement_housingUnitId_idx" ON "Settlement" USING btree ("housingUnitId");--> statement-breakpoint
CREATE INDEX "TaskAttentionFlag_taskId_idx" ON "TaskAttentionFlag" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "TaskCompletion_completedById_idx" ON "TaskCompletion" USING btree ("completedById");--> statement-breakpoint
CREATE INDEX "TaskCompletion_taskId_idx" ON "TaskCompletion" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "TaskRequest_requestedResidentId_idx" ON "TaskRequest" USING btree ("requestedResidentId");--> statement-breakpoint
CREATE INDEX "TaskRequest_taskId_idx" ON "TaskRequest" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "TransferRequest_residentId_idx" ON "TransferRequest" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "User_code_idx" ON "User" USING btree ("code");--> statement-breakpoint
CREATE INDEX "User_role_idx" ON "User" USING btree ("role");--> statement-breakpoint
CREATE INDEX "User_scope_idx" ON "User" USING btree ("scope");--> statement-breakpoint
CREATE UNIQUE INDEX "Vote_proposalId_residentId_key" ON "Vote" USING btree ("proposalId","residentId");--> statement-breakpoint
CREATE INDEX "Vote_residentId_idx" ON "Vote" USING btree ("residentId");