-- Wohnfähigkeit: how much help running a household a person needs.
--
-- The City's owner strategy fixes "Berücksichtigung von vulnerablen Personen"
-- as a minimum standard, and the Gemeinderat asked AOZ specifically for the
-- "systematische Erfassung der Anzahl vulnerabler Geflüchteter". AOZ answered
-- both on paper — a medical vulnerability assessment form in 2025, plus a
-- separate project to record "Klient*innen mit eingeschränkten Wohnfähigkeiten
-- sowie insbesondere ältere Geflüchtete" in order to close "bestehende
-- Angebotslücken im Bereich Wohnen und Wohnbegleitung".
--
-- Everything in that sentence except Wohnfähigkeit was already recordable here
-- as a functional need. This column is the missing one.
--
-- It is NOT a second `supportLevel`. That column is contact frequency; this is
-- everyday competence — cooking, cleaning, post, appointments, keeping a
-- tenancy. They come apart in both directions, which is why one cannot stand
-- in for the other.
--
-- INDEPENDENT is the default so no existing row acquires a support need nobody
-- assessed. An unasked question must not read as an answer.
CREATE TYPE "LivingSkillsSupport" AS ENUM ('INDEPENDENT', 'SOME_SUPPORT', 'REGULAR_SUPPORT');

ALTER TABLE "Resident"
  ADD COLUMN "livingSkillsSupport" "LivingSkillsSupport" NOT NULL DEFAULT 'INDEPENDENT';

-- The reportable figure is a COUNT of people needing more than the default, so
-- the index serves the one query this column exists to answer.
CREATE INDEX "Resident_livingSkillsSupport_idx" ON "Resident"("livingSkillsSupport");
