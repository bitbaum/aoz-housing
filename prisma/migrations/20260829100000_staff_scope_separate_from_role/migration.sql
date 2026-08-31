-- Separate three facts that were one enum.
--
-- `StaffRole` answered three questions at once: which care domain do you work,
-- how much do you see, and may you reconfigure the product. So the real AOZ
-- setup could not be expressed: Franziska is a Betreuerin who ALSO sees every
-- client, and the only way to grant that was to make her ADMIN — which erased
-- her actual domain and handed her the settings page as a side effect.
--
-- Now: role = domain, scope = breadth, isSystemAdmin = administration.
--
-- Existing rows are migrated to keep behaviour byte-identical on day one:
-- every current ADMIN gets ALL_DOMAINS + isSystemAdmin, which is exactly what
-- ADMIN already meant. Nothing changes for anyone until an account is
-- deliberately re-roled.

CREATE TYPE "StaffScope" AS ENUM ('OWN_DOMAIN', 'ALL_DOMAINS');

ALTER TABLE "User" ADD COLUMN "scope" "StaffScope" NOT NULL DEFAULT 'OWN_DOMAIN';
ALTER TABLE "User" ADD COLUMN "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Preserve what ADMIN meant, as data rather than as a role.
UPDATE "User"
   SET "scope" = 'ALL_DOMAINS', "isSystemAdmin" = true
 WHERE "role" = 'ADMIN';

-- Finding the people who can see everything is the query an oversight change
-- starts from; without this it is a full scan of a table that will grow.
CREATE INDEX "User_scope_idx" ON "User"("scope");
