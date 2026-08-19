import type { MessageKey } from './dictionaries/de'
import type { Translator } from './index'
import {
  MAINTENANCE_SEVERITY_ICONS,
  REPORT_CONFLICT_SEVERITIES,
  REPORT_CONFLICT_TYPES,
  REPORT_LOCATIONS,
  REPORT_MAINTENANCE_SEVERITIES,
  REPORT_MAINTENANCE_TYPES,
  REPORT_TEMPLATES,
} from '@/lib/config/portal-report'

function key(id: string): MessageKey {
  return id as MessageKey
}

/** Labelled options for the resident report form — config values + i18n copy. */
export function buildReportFormLabels(t: Translator) {
  return {
    categoryMaintenance: t('report.categoryMaintenance'),
    categoryMaintenanceDesc: t('report.categoryMaintenanceDesc'),
    categoryConflict: t('report.categoryConflict'),
    categoryConflictDesc: t('report.categoryConflictDesc'),
    titleMaintenance: t('report.titleMaintenance'),
    titleConflict: t('report.titleConflict'),
    conflictSubtitle: t('report.conflictSubtitle'),
    typeLabel: t('report.typeLabel'),
    conflictTypeLabel: t('report.conflictTypeLabel'),
    selectPlaceholder: t('report.selectPlaceholder'),
    locationLabel: t('report.locationLabel'),
    involvedLabel: t('report.involvedLabel'),
    involvedPlaceholder: t('report.involvedPlaceholder'),
    involvedExternal: t('report.involvedExternal'),
    confidentialNote: t('report.confidentialNote'),
    descriptionLabel: t('report.descriptionLabel'),
    conflictDescriptionLabel: t('report.conflictDescriptionLabel'),
    descriptionPlaceholder: t('report.descriptionPlaceholder'),
    conflictDescriptionPlaceholder: t('report.conflictDescriptionPlaceholder'),
    dateLabel: t('report.dateLabel'),
    severityLabel: t('report.severityLabel'),
    conflictSeverityLabel: t('report.conflictSeverityLabel'),
    mediationLabel: t('report.mediationLabel'),
    submitMaintenance: t('report.submitMaintenance'),
    submitConflict: t('report.submitConflict'),
    submitting: t('report.submitting'),
    successTitle: t('report.successTitle'),
    successMessage: t('report.successMessage'),
    nextStepsTitle: t('report.nextStepsTitle'),
    nextSteps: [
      t('report.nextStep1'),
      t('report.nextStep2'),
      t('report.nextStep3'),
    ],
    successTip: t('report.successTip'),
    errorGeneric: t('report.errorGeneric'),
    quickTitle: t('report.quickTitle'),
    quickSubtitle: t('report.quickSubtitle'),
    resetTemplate: t('report.resetTemplate'),
    viewYours: t('reports.viewYours'),
    backToOverview: t('reports.backToOverview'),
    transparency: {
      title: t('report.transparency.title'),
      before: t('report.transparency.before'),
      open: t('report.transparency.open'),
      middle: t('report.transparency.middle'),
      resolved: t('report.transparency.resolved'),
      after: t('report.transparency.after'),
      seeMine: t('report.transparency.seeMine'),
    },
    maintenanceTypes: REPORT_MAINTENANCE_TYPES.map((value) => ({
      value,
      label: t(key(`report.maintenanceType.${value}`)),
    })),
    conflictTypes: REPORT_CONFLICT_TYPES.map((value) => ({
      value,
      label: t(key(`report.conflictType.${value}`)),
    })),
    locations: REPORT_LOCATIONS.map((value) => ({
      value,
      label: t(key(`report.location.${value}`)),
    })),
    severityOptions: {
      MAINTENANCE: REPORT_MAINTENANCE_SEVERITIES.map((value) => ({
        value,
        label: t(key(`report.severity.maintenance.${value}`)),
        icon: MAINTENANCE_SEVERITY_ICONS[value],
      })),
      INTERPERSONAL: REPORT_CONFLICT_SEVERITIES.map((value) => ({
        value,
        label: t(key(`report.severity.interpersonal.${value}.label`)),
        desc: t(key(`report.severity.interpersonal.${value}.desc`)),
      })),
    },
  templates: REPORT_TEMPLATES.map((template) => ({
    ...template,
    icon:
      template.key === 'maintenance-urgent'
        ? '🔧'
        : template.key === 'noise'
          ? '🔊'
          : '🚨',
    label: t(key(template.labelKey)),
    description: t(key(template.descriptionKey)),
  })),
  }
}

export type ReportFormLabels = ReturnType<typeof buildReportFormLabels>
