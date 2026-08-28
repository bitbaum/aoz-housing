-- Career evidence a resident can show an employer: CV, certificate, reference.
--
-- A job coach had nowhere to put a CV. The JOBCOACH role, the JOB care domain
-- and the job_goal / work_status attributes all shipped while the artefact the
-- work revolves around could not be attached to anyone.
--
-- Bytes live in their own table so a list query that renders titles and dates
-- never pulls megabytes — the same reason ResidentPhoto is separate from
-- Resident.

CREATE TABLE "ResidentDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT,

    CONSTRAINT "ResidentDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ResidentDocument_residentId_createdAt_idx"
    ON "ResidentDocument"("residentId", "createdAt");

-- Cascade: a deleted resident's file goes with them.
ALTER TABLE "ResidentDocument" ADD CONSTRAINT "ResidentDocument_residentId_fkey"
    FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SetNull: losing a staff account must not delete a resident's CV. Who
-- uploaded it is metadata about the file, not ownership of it.
ALTER TABLE "ResidentDocument" ADD CONSTRAINT "ResidentDocument_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ResidentDocumentBlob" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "ResidentDocumentBlob_pkey" PRIMARY KEY ("documentId")
);

ALTER TABLE "ResidentDocumentBlob" ADD CONSTRAINT "ResidentDocumentBlob_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "ResidentDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
