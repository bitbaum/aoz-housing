CREATE TYPE "public"."SiteAccess" AS ENUM('ALL_UNITS', 'ASSIGNED_UNITS');--> statement-breakpoint
CREATE TABLE "StaffUnit" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"staffId" text NOT NULL,
	"housingUnitId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "siteAccess" "SiteAccess" DEFAULT 'ALL_UNITS' NOT NULL;--> statement-breakpoint
ALTER TABLE "StaffUnit" ADD CONSTRAINT "StaffUnit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "StaffUnit" ADD CONSTRAINT "StaffUnit_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "public"."HousingUnit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "StaffUnit_staffId_housingUnitId_key" ON "StaffUnit" USING btree ("staffId","housingUnitId");--> statement-breakpoint
CREATE INDEX "StaffUnit_housingUnitId_idx" ON "StaffUnit" USING btree ("housingUnitId");