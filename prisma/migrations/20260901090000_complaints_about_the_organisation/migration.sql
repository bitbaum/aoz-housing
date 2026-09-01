-- A channel that points at the organisation, not at the resident.
--
-- The report form has offered exactly two destinations: a dripping tap to the
-- maintenance board, a roommate conflict to the incident ladder. An objection
-- to how AOZ itself acted fitted neither, and filing it as an Incident would
-- have been worse than dropping it: that ladder escalates TOWARD a resident and
-- ends in FORMAL_MEASURE, so complaining about staff would have opened a case
-- against the person complaining.
--
-- The City's Eigentümerstrategie 2025-2028 fixes "Information und
-- Beschwerdestellen" as one of six minimum standards in AOZ's Leistungsauftrag.
-- AOZ's own central Beschwerdestelle logged 88 complaints in 2023, 145 in 2024
-- and 242 in 2025 — 38% of the last figure about Unterbringung und
-- Zusammenleben, while the client count stayed flat. The product had no side of
-- that obligation at all.
CREATE TYPE "ComplaintSubject" AS ENUM ('STAFF', 'ACCOMMODATION', 'DECISION', 'OTHER');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ANSWERED');

CREATE TABLE "Complaint" (
  "id"                TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  -- NULL = filed anonymously. Someone objecting to the organisation that
  -- houses them pays a cost for being identifiable, so anonymity has to be on
  -- offer. SET NULL rather than CASCADE on purpose: a complaint must outlive
  -- the reporter's record, or deleting a person would erase what they said
  -- about the service.
  "residentId"        TEXT,

  "subject"           "ComplaintSubject" NOT NULL,
  "body"              TEXT NOT NULL,
  "status"            "ComplaintStatus" NOT NULL DEFAULT 'OPEN',

  "response"          TEXT,
  "respondedAt"       TIMESTAMP(3),
  "respondedByUserId" TEXT,

  CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Complaint"
  ADD CONSTRAINT "Complaint_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Complaint"
  ADD CONSTRAINT "Complaint_respondedByUserId_fkey"
  FOREIGN KEY ("respondedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX "Complaint_residentId_idx" ON "Complaint"("residentId");
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");
