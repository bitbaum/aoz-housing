-- A satisfaction check-in can name the appointment it was collected in.
--
-- Nullable: the resident's own portal rating and the deliberate full form are
-- both legitimate and keep writing NULL here. Unique: an appointment is one
-- conversation, so a second reading of the same meeting is a correction rather
-- than a new fact. ON DELETE SET NULL because the check-in is the record of
-- what someone said — removing the calendar entry must not remove that.

ALTER TABLE "SatisfactionCheckIn" ADD COLUMN "appointmentId" TEXT;

CREATE UNIQUE INDEX "SatisfactionCheckIn_appointmentId_key"
    ON "SatisfactionCheckIn"("appointmentId");

ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Who recorded it, as a key rather than as prose.
--
-- "collectedBy" is free text a human types into the full form ("Team Nord").
-- It was briefly also used to hold a user id, so the column could contain
-- either with no way to tell them apart. This splits the two: prose stays in
-- "collectedBy", identity moves here. Existing rows keep their prose and get
-- NULL here, which correctly reads as "we do not know which account".

ALTER TABLE "SatisfactionCheckIn" ADD COLUMN "collectedByUserId" TEXT;

CREATE INDEX "SatisfactionCheckIn_collectedByUserId_idx"
    ON "SatisfactionCheckIn"("collectedByUserId");

ALTER TABLE "SatisfactionCheckIn" ADD CONSTRAINT "SatisfactionCheckIn_collectedByUserId_fkey"
    FOREIGN KEY ("collectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
