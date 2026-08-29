-- Residents can ask for a meeting, and staff can move one without cancelling it.
--
-- Until now appointments were one-directional: staff scheduled, residents read.
-- The one thing that structures a resident's relationship with the people
-- responsible for them was the only surface they could not write to, while
-- expenses, chores, reports and transfers all accept their input.
--
-- Three changes, all additive:
--
-- 1. REQUESTED — a meeting asked for and not yet answered.
--
-- 2. "staffId" becomes NULLABLE. A resident asking for a meeting does not know
--    who will take it, and on a deployment where nobody holds the care seat
--    yet there is nobody to name. Requiring it would have made the feature
--    dead on arrival for exactly the residents who need it. Existing rows all
--    have a staff member and are untouched; the FK stays RESTRICT so removing
--    a colleague still cannot silently orphan their calendar.
--
-- 3. "residentNote" / "staffNote" — what was asked, and the answer that comes
--    back. The second is the important one: a decision stored and never
--    rendered is the same as no decision, which is the rule TransferRequest
--    already follows.

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'REQUESTED';

ALTER TABLE "Appointment" ALTER COLUMN "staffId" DROP NOT NULL;

ALTER TABLE "Appointment" ADD COLUMN "residentNote" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "staffNote" TEXT;

-- An unclaimed request is the thing staff need to find; every other status is
-- reached from a resident or a calendar view that is already indexed.
CREATE INDEX "Appointment_status_domain_idx" ON "Appointment"("status", "domain");
