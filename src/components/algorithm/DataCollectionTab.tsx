'use client'

import {
  Database,
  FileText,
} from 'lucide-react'
import {
  RESIDENT_FACTORS,
  RESIDENT_FORM_SECTIONS,
} from '@/lib/config/resident-factors'
import { FACTOR_SCIENCE } from '@/lib/config/algorithm-docs'
import { DATA_COLLECTION_TAB_LABELS } from '@/lib/constants'

export function DataCollectionTab() {
  const documentedFactors = Object.values(RESIDENT_FACTORS).filter(
    f => FACTOR_SCIENCE[f.id]?.dataCollectionMethod
  )

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold text-ui-text mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-primary" />
          {DATA_COLLECTION_TAB_LABELS.title}
        </h2>
        <p className="text-ui-muted mb-4">
          {DATA_COLLECTION_TAB_LABELS.intro}
        </p>
        <div className="bg-status-info/8 border border-status-info/25 rounded-lg p-4">
          <h3 className="font-medium text-status-info-text mb-2">{DATA_COLLECTION_TAB_LABELS.privacyTitle}</h3>
          <ul className="text-sm text-status-info-text space-y-1">
            <li>{DATA_COLLECTION_TAB_LABELS.privacyBullet1}</li>
            <li>{DATA_COLLECTION_TAB_LABELS.privacyBullet2}</li>
            <li>{DATA_COLLECTION_TAB_LABELS.privacyBullet3}</li>
            <li>{DATA_COLLECTION_TAB_LABELS.privacyBullet4}</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-ui-text mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-ui-muted" />
          {DATA_COLLECTION_TAB_LABELS.methodsTitle}
        </h3>

        <div className="space-y-4">
          {documentedFactors.map(factor => {
            const science = FACTOR_SCIENCE[factor.id]
            if (!science) return null

            return (
              <div key={factor.id} className="border border-ui-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-ui-text">{factor.label}</h4>
                  <span className="text-xs bg-ui-subtle text-ui-muted px-2 py-1 rounded capitalize">
                    {factor.type === 'scale' ? DATA_COLLECTION_TAB_LABELS.scaleType : factor.type}
                  </span>
                </div>
                <p className="text-sm text-ui-muted">{science.dataCollectionMethod}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-ui-text mb-4">{DATA_COLLECTION_TAB_LABELS.formSectionsTitle}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {RESIDENT_FORM_SECTIONS.filter(s => s.id !== 'notes').map(section => {
            const factorCount = Object.values(RESIDENT_FACTORS).filter(
              f => f.formSection === section.id
            ).length
            return (
              <div key={section.id} className="bg-ui-subtle rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ui-text">{section.label}</span>
                  <span className="text-xs text-ui-muted">{factorCount} {DATA_COLLECTION_TAB_LABELS.fieldsSuffix}</span>
                </div>
                {section.description && (
                  <p className="text-xs text-ui-muted mt-1">{section.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
