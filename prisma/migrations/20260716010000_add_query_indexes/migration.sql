-- CreateIndex
CREATE INDEX "CompatibilityAssessment_comparedWithId_idx" ON "CompatibilityAssessment"("comparedWithId");

-- CreateIndex
CREATE INDEX "Incident_housingUnitId_category_date_idx" ON "Incident"("housingUnitId", "category", "date");

-- CreateIndex
CREATE INDEX "Placement_compatibilityScore_idx" ON "Placement"("compatibilityScore");
