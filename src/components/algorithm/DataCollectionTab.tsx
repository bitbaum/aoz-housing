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

export function DataCollectionTab() {
  const documentedFactors = Object.values(RESIDENT_FACTORS).filter(
    f => FACTOR_SCIENCE[f.id]?.dataCollectionMethod
  )

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-aoz-primary" />
          Wie werden die Daten erfasst?
        </h2>
        <p className="text-gray-600 mb-4">
          Alle Daten werden bei der Aufnahme durch das Bewohner-Formular erfasst.
          Die Fragen sind so gestaltet, dass sie ohne Sprachbarrieren verständlich sind
          (Skalen, Bildauswahl wo möglich).
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Datenschutz-Grundsätze</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Nur funktionale Daten, keine medizinischen Diagnosen</li>
            <li>- Selbstauskunft der Bewohner</li>
            <li>- Anonymisierte Verarbeitung</li>
            <li>- Keine politischen/religiösen Daten</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Erfassungsmethoden pro Faktor
        </h3>

        <div className="space-y-4">
          {documentedFactors.map(factor => {
            const science = FACTOR_SCIENCE[factor.id]
            if (!science) return null

            return (
              <div key={factor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{factor.label}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                    {factor.type === 'scale' ? 'Skala 1-5' : factor.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{science.dataCollectionMethod}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Formular-Sektionen</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {RESIDENT_FORM_SECTIONS.filter(s => s.id !== 'notes').map(section => {
            const factorCount = Object.values(RESIDENT_FACTORS).filter(
              f => f.formSection === section.id
            ).length
            return (
              <div key={section.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{section.label}</span>
                  <span className="text-xs text-gray-500">{factorCount} Felder</span>
                </div>
                {section.description && (
                  <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
