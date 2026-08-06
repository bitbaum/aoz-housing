-- CreateEnum
CREATE TYPE "RuleScope" AS ENUM ('ORG', 'UNIT');

-- CreateEnum
CREATE TYPE "RuleDelegation" AS ENUM ('FIXED', 'UNIT_MAY_STRENGTHEN', 'UNIT_DECIDES');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('SAFETY', 'RESPECT', 'NOISE', 'CLEANLINESS', 'KITCHEN', 'BATHROOM', 'GUESTS', 'SHARED_SPACES', 'COSTS', 'COMMUNICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('ADD_RULE', 'AMEND_RULE', 'REPEAL_RULE', 'HOUSE_DECISION');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DISCUSSION', 'VOTING', 'NEEDS_STAFF_CONFIRMATION', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'VETOED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DecisionMode" AS ENUM ('RESIDENT_BINDING', 'RESIDENT_ADVISORY', 'STAFF_ONLY');

-- CreateEnum
CREATE TYPE "VoteThreshold" AS ENUM ('CONSENSUS', 'SUPERMAJORITY', 'SIMPLE_MAJORITY');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('YES', 'NO', 'ABSTAIN', 'BLOCK');

-- CreateEnum
CREATE TYPE "StaffDecision" AS ENUM ('CONFIRMED', 'VETOED');

-- CreateEnum
CREATE TYPE "ResolutionStage" AS ENUM ('REPORTED', 'SELF_RESOLUTION', 'PEER_MEDIATION', 'STAFF_MEDIATION', 'FORMAL_MEASURE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'HELD', 'BROKEN', 'EXPIRED');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "resolutionStage" "ResolutionStage" NOT NULL DEFAULT 'REPORTED',
ADD COLUMN     "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "HouseRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" "RuleScope" NOT NULL,
    "housingUnitId" TEXT,
    "key" TEXT,
    "category" "RuleCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "delegation" "RuleDelegation" NOT NULL DEFAULT 'FIXED',
    "parentRuleId" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "adoptedByProposalId" TEXT,
    "createdByStaff" TEXT,

    CONSTRAINT "HouseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAcknowledgement" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "category" "RuleCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetRuleId" TEXT,
    "parentOrgRuleId" TEXT,
    "proposedByResidentId" TEXT,
    "proposedByStaff" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DISCUSSION',
    "decisionMode" "DecisionMode" NOT NULL,
    "threshold" "VoteThreshold" NOT NULL,
    "quorumPercent" INTEGER NOT NULL,
    "approvalPercent" INTEGER NOT NULL,
    "eligibleVoterCount" INTEGER NOT NULL DEFAULT 0,
    "discussionEndsAt" TIMESTAMP(3),
    "votingOpenedAt" TIMESTAMP(3),
    "votingEndsAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "outcomeSummary" TEXT,
    "staffDecision" "StaffDecision",
    "staffNotes" TEXT,
    "staffUserId" TEXT,
    "staffDecidedAt" TIMESTAMP(3),

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "reason" TEXT,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictAgreement" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "incidentId" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "mediatorName" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PROPOSED',
    "outcomeNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "ruleProposalId" TEXT,

    CONSTRAINT "ConflictAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementParty" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),

    CONSTRAINT "AgreementParty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseRule_key_key" ON "HouseRule"("key");

-- CreateIndex
CREATE INDEX "HouseRule_scope_status_idx" ON "HouseRule"("scope", "status");

-- CreateIndex
CREATE INDEX "HouseRule_housingUnitId_status_idx" ON "HouseRule"("housingUnitId", "status");

-- CreateIndex
CREATE INDEX "HouseRule_category_idx" ON "HouseRule"("category");

-- CreateIndex
CREATE INDEX "HouseRule_parentRuleId_idx" ON "HouseRule"("parentRuleId");

-- CreateIndex
CREATE INDEX "RuleAcknowledgement_residentId_idx" ON "RuleAcknowledgement"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleAcknowledgement_ruleId_residentId_ruleVersion_key" ON "RuleAcknowledgement"("ruleId", "residentId", "ruleVersion");

-- CreateIndex
CREATE INDEX "Proposal_housingUnitId_status_idx" ON "Proposal"("housingUnitId", "status");

-- CreateIndex
CREATE INDEX "Proposal_status_votingEndsAt_idx" ON "Proposal"("status", "votingEndsAt");

-- CreateIndex
CREATE INDEX "Vote_residentId_idx" ON "Vote"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_proposalId_residentId_key" ON "Vote"("proposalId", "residentId");

-- CreateIndex
CREATE UNIQUE INDEX "ConflictAgreement_ruleProposalId_key" ON "ConflictAgreement"("ruleProposalId");

-- CreateIndex
CREATE INDEX "ConflictAgreement_incidentId_idx" ON "ConflictAgreement"("incidentId");

-- CreateIndex
CREATE INDEX "ConflictAgreement_status_reviewDate_idx" ON "ConflictAgreement"("status", "reviewDate");

-- CreateIndex
CREATE INDEX "AgreementParty_residentId_idx" ON "AgreementParty"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementParty_agreementId_residentId_key" ON "AgreementParty"("agreementId", "residentId");

-- AddForeignKey
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_parentRuleId_fkey" FOREIGN KEY ("parentRuleId") REFERENCES "HouseRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_adoptedByProposalId_fkey" FOREIGN KEY ("adoptedByProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAcknowledgement" ADD CONSTRAINT "RuleAcknowledgement_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "HouseRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAcknowledgement" ADD CONSTRAINT "RuleAcknowledgement_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "HousingUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_targetRuleId_fkey" FOREIGN KEY ("targetRuleId") REFERENCES "HouseRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_parentOrgRuleId_fkey" FOREIGN KEY ("parentOrgRuleId") REFERENCES "HouseRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_proposedByResidentId_fkey" FOREIGN KEY ("proposedByResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictAgreement" ADD CONSTRAINT "ConflictAgreement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictAgreement" ADD CONSTRAINT "ConflictAgreement_ruleProposalId_fkey" FOREIGN KEY ("ruleProposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementParty" ADD CONSTRAINT "AgreementParty_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "ConflictAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementParty" ADD CONSTRAINT "AgreementParty_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

