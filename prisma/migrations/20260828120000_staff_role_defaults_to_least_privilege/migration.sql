-- Staff accounts default to the NARROWEST role, not the widest.
--
-- "User"."role" defaulted to ADMIN (Leitung), so any row created without
-- naming a role got every permission in the product. Combined with
-- /api/auth/register hardcoding 'ADMIN', that is how all 23 staff accounts in
-- production ended up as Leitung — which in turn meant the role system had no
-- subjects to differentiate and every access boundary was a no-op.
--
-- Existing rows are untouched: a column default applies only to new inserts.
-- Re-roling the accounts that already exist is a decision about who may do
-- what at AOZ, not a migration.

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BETREUUNG';
