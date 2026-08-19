import { createTranslator } from '@/lib/i18n'
import { buildReportFormLabels } from '@/lib/i18n/report-form'
import { REPORT_MAINTENANCE_TYPES } from '@/lib/config/portal-report'

describe('buildReportFormLabels', () => {
  it('maps every maintenance type to a non-empty label', () => {
    const labels = buildReportFormLabels(createTranslator('de'))
    expect(labels.maintenanceTypes.map((t) => t.value)).toEqual([...REPORT_MAINTENANCE_TYPES])
    for (const entry of labels.maintenanceTypes) {
      expect(entry.label.trim().length).toBeGreaterThan(0)
    }
  })
})
