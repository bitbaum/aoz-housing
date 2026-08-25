-- Marketplace: goods AND services.
--
-- Two kinds are added for exchanges of TIME rather than objects, the category
-- column stops being a database enum (vocabulary belongs in config, so a new
-- category is one line rather than a migration), and two columns close the
-- handover loop that used to end at "claimed" with no way to arrange anything.

-- 1. Kinds for service exchanges. Additive: every existing row keeps its value.
ALTER TYPE "MarketplacePostKind" ADD VALUE IF NOT EXISTS 'OFFER_HELP';
ALTER TYPE "MarketplacePostKind" ADD VALUE IF NOT EXISTS 'NEED_HELP';

-- 2. Category enum -> text. `USING category::text` preserves every existing
--    value verbatim (FURNITURE stays FURNITURE), so no row is reinterpreted.
ALTER TABLE "MarketplacePost"
  ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "MarketplacePost"
  ALTER COLUMN "category" TYPE TEXT USING "category"::text;

ALTER TABLE "MarketplacePost"
  ALTER COLUMN "category" SET DEFAULT 'OTHER';

DROP TYPE IF EXISTS "MarketplacePostCategory";

-- 3. The handover. `contactNote` is how the two people actually meet — there
--    is no resident-to-resident messaging in this product, so without it a
--    match strands both sides. It is read back only to the claimer and staff.
ALTER TABLE "MarketplacePost"
  ADD COLUMN IF NOT EXISTS "contactNote" TEXT,
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);

-- Existing claims have no timestamp to recover; the row's own updatedAt is the
-- closest true statement, and leaving it NULL would read as "never claimed".
UPDATE "MarketplacePost"
SET "claimedAt" = "updatedAt"
WHERE "claimedById" IS NOT NULL AND "claimedAt" IS NULL;
