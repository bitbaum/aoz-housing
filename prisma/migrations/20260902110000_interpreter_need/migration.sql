-- Whether a conversation with this person needs an interpreter booked.
--
-- AOZ runs Medios: roughly 80 languages, about 1000 interpreters, booked on an
-- external platform (Bhaasha) with around a day's confirmation lead time. This
-- product does not rebuild that booking and should not.
--
-- What it can do is stop the failure that lead time creates: a meeting
-- scheduled for tomorrow morning with nobody able to speak to the person once
-- it starts. The product already PROMISES this help — the conflict-mediation
-- copy tells residents Betreuung will assist "zum Beispiel mit Dolmetschung" —
-- with no mechanism behind the sentence.
--
-- The LEVEL only. Which language is already on `Resident.languages`, and a
-- second column naming it would be a second source of truth that drifts.
--
-- NONE is the default so no existing row acquires a need nobody assessed.
CREATE TYPE "InterpreterNeed" AS ENUM ('NONE', 'FOR_COMPLEX', 'ALWAYS');

ALTER TABLE "Resident"
  ADD COLUMN "interpreterNeed" "InterpreterNeed" NOT NULL DEFAULT 'NONE';

-- The reportable question is "how many of our clients need interpreting", which
-- is a count over this column.
CREATE INDEX "Resident_interpreterNeed_idx" ON "Resident"("interpreterNeed");
