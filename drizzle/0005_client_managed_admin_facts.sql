CREATE TYPE "public"."ClientFactStatus" AS ENUM('PENDING', 'CONFIRMED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."PermitType" AS ENUM('N', 'F', 'B', 'C', 'S', 'OTHER', 'UNSPECIFIED');--> statement-breakpoint
CREATE TABLE "ClientHealthContact" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"name" text NOT NULL,
	"profession" text NOT NULL,
	"phone" text,
	"address" text,
	"note" text,
	"status" "ClientFactStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedBy" text,
	"reviewedAt" timestamp (3),
	"staffNote" text
);
--> statement-breakpoint
CREATE TABLE "ClientInsurance" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"insurerName" text NOT NULL,
	"policyNumber" text,
	"validUntil" timestamp (3),
	"status" "ClientFactStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedBy" text,
	"reviewedAt" timestamp (3),
	"staffNote" text
);
--> statement-breakpoint
CREATE TABLE "ClientPermit" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"residentId" text NOT NULL,
	"type" "PermitType" DEFAULT 'UNSPECIFIED' NOT NULL,
	"validUntil" timestamp (3),
	"status" "ClientFactStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewedBy" text,
	"reviewedAt" timestamp (3),
	"staffNote" text
);
--> statement-breakpoint
ALTER TABLE "ClientHealthContact" ADD CONSTRAINT "ClientHealthContact_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ClientHealthContact" ADD CONSTRAINT "ClientHealthContact_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ClientInsurance" ADD CONSTRAINT "ClientInsurance_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ClientInsurance" ADD CONSTRAINT "ClientInsurance_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ClientPermit" ADD CONSTRAINT "ClientPermit_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "public"."Resident"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ClientPermit" ADD CONSTRAINT "ClientPermit_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ClientHealthContact_residentId_idx" ON "ClientHealthContact" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "ClientHealthContact_status_idx" ON "ClientHealthContact" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ClientInsurance_residentId_idx" ON "ClientInsurance" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "ClientInsurance_status_idx" ON "ClientInsurance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ClientInsurance_validUntil_idx" ON "ClientInsurance" USING btree ("validUntil");--> statement-breakpoint
CREATE UNIQUE INDEX "ClientPermit_residentId_key" ON "ClientPermit" USING btree ("residentId");--> statement-breakpoint
CREATE INDEX "ClientPermit_validUntil_idx" ON "ClientPermit" USING btree ("validUntil");