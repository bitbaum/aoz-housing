-- Split the single "cleanlinessLevel" scale into the three distinct things it
-- was conflating. Conflicts about cleanliness are not caused by a difference in
-- tidiness as such — they are caused by the directional gap between what one
-- person expects of others and what another person actually does, softened by
-- how much disorder the first person can live with.

-- The old scale was filled in as "how tidy is this person", so it carries over
-- to practice without data loss. RENAME rather than DROP/ADD: dropping would
-- discard every resident's answer.
ALTER TABLE "Resident" RENAME COLUMN "cleanlinessLevel" TO "cleanlinessPractice";

-- The two new dimensions start neutral rather than derived from practice.
-- Deriving them would be fabricating answers residents never gave: a tidy
-- person does not necessarily demand tidiness from others, and tolerance for
-- mess is genuinely independent of one's own habits. The portal asks for them.
ALTER TABLE "Resident"
  ADD COLUMN "cleanlinessExpectation" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "chaosTolerance" INTEGER NOT NULL DEFAULT 3;
