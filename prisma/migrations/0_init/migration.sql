-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY');

-- CreateEnum
CREATE TYPE "FamilyStatus" AS ENUM ('SINGLE', 'COUPLE', 'FAMILY_WITH_CHILDREN', 'SINGLE_PARENT');

-- CreateEnum
CREATE TYPE "SleepSchedule" AS ENUM ('EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "SocialStyle" AS ENUM ('INTROVERTED', 'MODERATE', 'EXTROVERTED');

-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('NON_SMOKER', 'OUTDOOR_SMOKER', 'INDOOR_SMOKER');

-- CreateEnum
CREATE TYPE "MobilityNeed" AS ENUM ('NONE', 'GROUND_FLOOR', 'WHEELCHAIR');

-- CreateEnum
CREATE TYPE "ResidentStatus" AS ENUM ('ACTIVE', 'PLACED', 'TRANSFERRED', 'EXITED');

-- CreateEnum
CREATE TYPE "MedicalDocType" AS ENUM ('PRIVATE_ROOM', 'STUDIO', 'BOTH');

-- CreateEnum
CREATE TYPE "RoomSharingStatus" AS ENUM ('CAN_SHARE', 'PREFERS_PRIVATE', 'NEEDS_PRIVATE');

-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('STANDARD', 'ELEVATED', 'INTENSIVE');

-- CreateEnum
CREATE TYPE "RecyclingKnowledge" AS ENUM ('NONE', 'BASIC', 'GOOD');

-- CreateEnum
CREATE TYPE "ConflictStyle" AS ENUM ('AVOIDANT', 'COOPERATIVE', 'DIRECT');

-- CreateEnum
CREATE TYPE "HousingStatus" AS ENUM ('AVAILABLE', 'FULL', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "SpotType" AS ENUM ('BED', 'PRIVATE_ROOM', 'STUDIO', 'ROOM');

-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('ACTIVE', 'ENDED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "EndReason" AS ENUM ('NATURAL', 'CONFLICT', 'REQUEST', 'CAPACITY', 'UPGRADE', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InvolvementRole" AS ENUM ('INVOLVED', 'WITNESS', 'MEDIATOR');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('NOISE_COMPLAINT', 'CLEANLINESS_DISPUTE', 'PERSONAL_CONFLICT', 'CULTURAL_FRICTION', 'SPACE_DISPUTE', 'SCHEDULE_CONFLICT', 'SAFETY_CONCERN', 'PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'SECURITY_SYSTEM', 'GENERAL_MAINTENANCE', 'LOW_SATISFACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('INTERPERSONAL', 'MAINTENANCE', 'SAFETY', 'WELLBEING');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CheckInType" AS ENUM ('INITIAL', 'REGULAR', 'AD_HOC', 'EXIT');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'CASE_WORKER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'SECURITY', 'CLEANING', 'EXTERIOR', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HouseholdTaskType" AS ENUM ('ONE_TIME', 'RECURRING_SCHEDULED', 'RECURRING_AS_NEEDED');

-- CreateEnum
CREATE TYPE "HouseholdTaskCategory" AS ENUM ('CLEANING', 'SHOPPING', 'MAINTENANCE', 'COOKING', 'TRASH', 'OTHER');

-- CreateEnum
CREATE TYPE "HouseholdTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HouseholdTaskStatus" AS ENUM ('IDLE', 'NEEDS_ATTENTION', 'REQUESTED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "TaskRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "ageRange" "AgeRange" NOT NULL,
    "gender" "Gender" NOT NULL,
    "familyStatus" "FamilyStatus" NOT NULL,
    "sleepSchedule" "SleepSchedule" NOT NULL,
    "noiseTolerance" INTEGER NOT NULL,
    "cleanlinessLevel" INTEGER NOT NULL,
    "guestTolerance" INTEGER NOT NULL DEFAULT 3,
    "socialStyle" "SocialStyle" NOT NULL,
    "languages" TEXT[],
    "culturalRegion" TEXT,
    "conflictStyle" "ConflictStyle" NOT NULL DEFAULT 'COOPERATIVE',
    "smokingStatus" "SmokingStatus" NOT NULL,
    "dietaryNeeds" TEXT[],
    "mobilityNeeds" "MobilityNeed" NOT NULL,
    "medicalEquipment" BOOLEAN NOT NULL DEFAULT false,
    "petTolerance" BOOLEAN NOT NULL DEFAULT true,
    "sharedBathroom" BOOLEAN NOT NULL DEFAULT true,
    "sharedKitchen" BOOLEAN NOT NULL DEFAULT true,
    "privacyNeed" INTEGER NOT NULL,
    "choresContribution" INTEGER NOT NULL DEFAULT 3,
    "recyclingKnowledge" "RecyclingKnowledge" NOT NULL DEFAULT 'NONE',
    "roomSharingStatus" "RoomSharingStatus" NOT NULL DEFAULT 'CAN_SHARE',
    "hasNightDisturbances" BOOLEAN NOT NULL DEFAULT false,
    "needsQuietEnvironment" BOOLEAN NOT NULL DEFAULT false,
    "hasSleepEquipment" BOOLEAN NOT NULL DEFAULT false,
    "supportLevel" "SupportLevel" NOT NULL DEFAULT 'STANDARD',
    "roommatePreferences" TEXT,
    "status" "ResidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "hasMedicalDocumentation" BOOLEAN NOT NULL DEFAULT false,
    "medicalDocType" "MedicalDocType",
    "medicalDocDate" TIMESTAMP(3),
    "medicalDocNotes" TEXT,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousingUnit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "sharedRooms" INTEGER NOT NULL,
    "privateRooms" INTEGER NOT NULL,
    "sharedBathrooms" INTEGER NOT NULL,
    "privateBathrooms" INTEGER NOT NULL,
    "sharedKitchen" BOOLEAN NOT NULL DEFAULT true,
    "privateKitchen" BOOLEAN NOT NULL DEFAULT false,
    "groundFloor" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccess" BOOLEAN NOT NULL DEFAULT false,
    "elevator" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "quietHours" TEXT,
    "nearPublicTransport" BOOLEAN NOT NULL DEFAULT true,
    "nearHealthServices" BOOLEAN NOT NULL DEFAULT false,
    "nearSchools" BOOLEAN NOT NULL DEFAULT false,
    "status" "HousingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,

    CONSTRAINT "HousingUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSpot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "type" "SpotType" NOT NULL,
    "parentSpotId" TEXT,
    "squareMeters" DOUBLE PRECISION,
    "floor" INTEGER,
    "hasPrivateBathroom" BOOLEAN NOT NULL DEFAULT false,
    "hasPrivateKitchen" BOOLEAN NOT NULL DEFAULT false,
    "hasPrivateToilet" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "requiresMedicalDocs" BOOLEAN NOT NULL DEFAULT false,
    "status" "SpotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,

    CONSTRAINT "PlacementSpot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "spotId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "compatibilityScore" DOUBLE PRECISION,
    "lifestyleScore" DOUBLE PRECISION,
    "socialScore" DOUBLE PRECISION,
    "practicalScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "status" "PlacementStatus" NOT NULL DEFAULT 'ACTIVE',
    "endReason" "EndReason",
    "satisfactionRating" INTEGER,
    "placementNotes" TEXT,
    "outcomeNotes" TEXT,
    "conflictGap" TEXT,
    "wasPredictable" BOOLEAN,
    "relatedIncidentId" TEXT,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityAssessment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT NOT NULL,
    "comparedWithId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "lifestyleScore" DOUBLE PRECISION NOT NULL,
    "socialScore" DOUBLE PRECISION NOT NULL,
    "practicalScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "strengths" TEXT[],
    "concerns" TEXT[],
    "recommendations" TEXT[],

    CONSTRAINT "CompatibilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "placementId" TEXT,
    "reportedById" TEXT,
    "subjectId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "IncidentCategory" NOT NULL DEFAULT 'INTERPERSONAL',
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "predictable" BOOLEAN,
    "compatibilityGap" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "followUpPriority" "FollowUpPriority",

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentFollowUp" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "outcome" TEXT,
    "staffName" TEXT,
    "scheduledNextDate" TIMESTAMP(3),

    CONSTRAINT "IncidentFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentInvolvement" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "role" "InvolvementRole" NOT NULL DEFAULT 'INVOLVED',

    CONSTRAINT "IncidentInvolvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionCheckIn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placementId" TEXT NOT NULL,
    "checkInType" "CheckInType" NOT NULL,
    "weekNumber" INTEGER,
    "overallSatisfaction" INTEGER NOT NULL,
    "roommateRelations" INTEGER,
    "facilitySatisfaction" INTEGER,
    "safetyFeeling" INTEGER,
    "concerns" TEXT,
    "improvements" TEXT,
    "positives" TEXT,
    "collectedBy" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SatisfactionCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmWeight" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lifestyleWeight" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "socialWeight" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "practicalWeight" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "riskWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "factorWeights" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "AlgorithmWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'CASE_WORKER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "changes" JSONB,
    "reason" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "spotId" TEXT,
    "category" "MaintenanceCategory" NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "reportedById" TEXT,
    "reporterName" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "taskType" "HouseholdTaskType" NOT NULL DEFAULT 'ONE_TIME',
    "category" "HouseholdTaskCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "HouseholdTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "scheduleHuman" TEXT,
    "estimatedMinutes" INTEGER,
    "currentStatus" "HouseholdTaskStatus" NOT NULL DEFAULT 'IDLE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdByResidentId" TEXT,
    "createdByStaff" TEXT,

    CONSTRAINT "HouseholdTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "completedById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "durationMinutes" INTEGER,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttentionFlag" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "flaggedById" TEXT NOT NULL,
    "message" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByCompletionId" TEXT,

    CONSTRAINT "TaskAttentionFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedResidentId" TEXT,
    "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "status" "TaskRequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseMessage" TEXT,
    "completionId" TEXT,

    CONSTRAINT "TaskRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resident_code_key" ON "Resident"("code");

-- CreateIndex
CREATE INDEX "Resident_status_idx" ON "Resident"("status");

-- CreateIndex
CREATE INDEX "Resident_ageRange_gender_idx" ON "Resident"("ageRange", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "HousingUnit_code_key" ON "HousingUnit"("code");

-- CreateIndex
CREATE INDEX "HousingUnit_status_idx" ON "HousingUnit"("status");

-- CreateIndex
CREATE INDEX "HousingUnit_totalBeds_idx" ON "HousingUnit"("totalBeds");

-- CreateIndex
CREATE INDEX "PlacementSpot_type_status_idx" ON "PlacementSpot"("type", "status");

-- CreateIndex
CREATE INDEX "PlacementSpot_requiresMedicalDocs_idx" ON "PlacementSpot"("requiresMedicalDocs");

-- CreateIndex
CREATE INDEX "PlacementSpot_housingUnitId_idx" ON "PlacementSpot"("housingUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementSpot_housingUnitId_code_key" ON "PlacementSpot"("housingUnitId", "code");

-- CreateIndex
CREATE INDEX "Placement_status_idx" ON "Placement"("status");

-- CreateIndex
CREATE INDEX "Placement_startDate_endDate_idx" ON "Placement"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Placement_residentId_idx" ON "Placement"("residentId");

-- CreateIndex
CREATE INDEX "Placement_housingUnitId_idx" ON "Placement"("housingUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_residentId_housingUnitId_startDate_key" ON "Placement"("residentId", "housingUnitId", "startDate");

-- CreateIndex
CREATE INDEX "CompatibilityAssessment_overallScore_idx" ON "CompatibilityAssessment"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityAssessment_residentId_comparedWithId_key" ON "CompatibilityAssessment"("residentId", "comparedWithId");

-- CreateIndex
CREATE INDEX "Incident_type_severity_idx" ON "Incident"("type", "severity");

-- CreateIndex
CREATE INDEX "Incident_date_idx" ON "Incident"("date");

-- CreateIndex
CREATE INDEX "Incident_reportedById_idx" ON "Incident"("reportedById");

-- CreateIndex
CREATE INDEX "Incident_subjectId_idx" ON "Incident"("subjectId");

-- CreateIndex
CREATE INDEX "Incident_nextFollowUpDate_idx" ON "Incident"("nextFollowUpDate");

-- CreateIndex
CREATE INDEX "IncidentFollowUp_incidentId_idx" ON "IncidentFollowUp"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentFollowUp_createdAt_idx" ON "IncidentFollowUp"("createdAt");

-- CreateIndex
CREATE INDEX "IncidentInvolvement_residentId_idx" ON "IncidentInvolvement"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentInvolvement_incidentId_residentId_key" ON "IncidentInvolvement"("incidentId", "residentId");

-- CreateIndex
CREATE INDEX "SatisfactionCheckIn_placementId_idx" ON "SatisfactionCheckIn"("placementId");

-- CreateIndex
CREATE INDEX "SatisfactionCheckIn_checkInType_idx" ON "SatisfactionCheckIn"("checkInType");

-- CreateIndex
CREATE INDEX "AlgorithmWeight_active_idx" ON "AlgorithmWeight"("active");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_housingUnitId_idx" ON "MaintenanceRequest"("housingUnitId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_priority_status_idx" ON "MaintenanceRequest"("priority", "status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_reportedById_idx" ON "MaintenanceRequest"("reportedById");

-- CreateIndex
CREATE INDEX "HouseholdTask_housingUnitId_currentStatus_idx" ON "HouseholdTask"("housingUnitId", "currentStatus");

-- CreateIndex
CREATE INDEX "HouseholdTask_housingUnitId_category_idx" ON "HouseholdTask"("housingUnitId", "category");

-- CreateIndex
CREATE INDEX "TaskCompletion_taskId_idx" ON "TaskCompletion"("taskId");

-- CreateIndex
CREATE INDEX "TaskCompletion_completedById_idx" ON "TaskCompletion"("completedById");

-- CreateIndex
CREATE INDEX "TaskAttentionFlag_taskId_idx" ON "TaskAttentionFlag"("taskId");

-- CreateIndex
CREATE INDEX "TaskRequest_taskId_idx" ON "TaskRequest"("taskId");

-- CreateIndex
CREATE INDEX "TaskRequest_requestedResidentId_idx" ON "TaskRequest"("requestedResidentId");

-- AddForeignKey
ALTER TABLE "PlacementSpot" ADD CONSTRAINT "PlacementSpot_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSpot" ADD CONSTRAINT "PlacementSpot_parentSpotId_fkey" FOREIGN KEY ("parentSpotId") REFERENCES "PlacementSpot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "PlacementSpot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_relatedIncidentId_fkey" FOREIGN KEY ("relatedIncidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityAssessment" ADD CONSTRAINT "CompatibilityAssessment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityAssessment" ADD CONSTRAINT "CompatibilityAssessment_comparedWithId_fkey" FOREIGN KEY ("comparedWithId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentFollowUp" ADD CONSTRAINT "IncidentFollowUp_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvement" ADD CONSTRAINT "IncidentInvolvement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentInvolvement" ADD CONSTRAINT "IncidentInvolvement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "PlacementSpot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTask" ADD CONSTRAINT "HouseholdTask_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdTask" ADD CONSTRAINT "HouseholdTask_createdByResidentId_fkey" FOREIGN KEY ("createdByResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HouseholdTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HouseholdTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttentionFlag" ADD CONSTRAINT "TaskAttentionFlag_resolvedByCompletionId_fkey" FOREIGN KEY ("resolvedByCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "HouseholdTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_requestedResidentId_fkey" FOREIGN KEY ("requestedResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "TaskCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

