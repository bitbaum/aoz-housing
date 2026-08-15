-- Chore fairness: a checkable definition of done, a derived rotation, and the
-- record needed to weight contributions by time rather than by row count.
--
-- All three columns are additive with defaults, so this migration is safe under
-- fleetcrown's apply-schema.sh guard (no DROP / TRUNCATE / ALTER COLUMN TYPE)
-- and cannot lose a single existing completion.

-- Definition of done: ordered binary actions, not an outcome description.
ALTER TABLE "HouseholdTask" ADD COLUMN "checklist" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ordered rotation for scheduled tasks. Whose turn it is stays DERIVED.
ALTER TABLE "HouseholdTask" ADD COLUMN "rotationResidentIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Which checklist items a completion actually ticked, stored by label so that
-- amending a task's checklist later cannot rewrite what a past completion said.
ALTER TABLE "TaskCompletion" ADD COLUMN "completedItems" TEXT[] DEFAULT ARRAY[]::TEXT[];
