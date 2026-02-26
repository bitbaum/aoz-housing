'use client'

import {
  Brain,
  Users,
  Target,
  Scale,
  BookOpen,
  Layers,
  Beaker,
} from 'lucide-react'
import { RESIDENT_DIMENSIONS } from '@/lib/config/resident-factors'
import {
  FACTOR_COUNT,
  DIMENSION_COUNT,
  getFactorsByDimension,
  ProcessStep,
  DimensionCard,
  ScoreLevel,
} from './shared'

export function OverviewTab() {
  const dimensionColors = ['purple', 'blue', 'green', 'orange'] as const

  return (
    <div className="space-y-8">
      {/* How it Works */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-aoz-primary" />
          So funktioniert das Matching
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <ProcessStep
            number={1}
            title="Profil erfassen"
            description="Bei der Aufnahme werden Präferenzen und Bedürfnisse systematisch erfasst."
            icon={<Users className="w-6 h-6" />}
          />
          <ProcessStep
            number={2}
            title="Kompatibilität berechnen"
            description={`${FACTOR_COUNT} Faktoren werden gewichtet verglichen.`}
            icon={<Brain className="w-6 h-6" />}
          />
          <ProcessStep
            number={3}
            title="Empfehlung erhalten"
            description="Ein Score zeigt die Eignung, Warnungen weisen auf Risiken hin."
            icon={<Scale className="w-6 h-6" />}
          />
        </div>
      </section>

      {/* Scientific Methodology Summary */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-aoz-primary" />
          Wissenschaftliche Methodik
        </h2>
        <div className="text-gray-600 space-y-2">
          <p>
            Die Gewichtung der Faktoren basiert auf einem evidenzbasierten Ansatz: Jeder Faktor wird
            durch mindestens eine publizierte Studie gestützt. Wir unterscheiden zwischen starker
            Evidenz (experimentelle Studien, grosse Umfragen), moderater Evidenz (Beobachtungsstudien,
            Expertenkonsens) und vorläufiger Evidenz (Einzelstudien, indirekte Belege).
          </p>
          <p>
            Schweizer Forschung wird priorisiert, da sie den lokalen Kontext von Asylunterkünften
            am besten abbildet. Internationale Studien dienen zur Validierung und Ergänzung.
            Die Gewichtungen werden regelmässig überprüft, wenn neue Forschungsergebnisse vorliegen.
          </p>
        </div>
      </section>

      {/* Dimensions with Visual Weight Bars */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-aoz-primary" />
          Die {DIMENSION_COUNT} Dimensionen
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {RESIDENT_DIMENSIONS.map((dim, i) => {
            const factors = getFactorsByDimension(dim.id)
            return (
              <DimensionCard
                key={dim.id}
                name={dim.label}
                weight={Math.round(dim.weight * 100)}
                color={dimensionColors[i % dimensionColors.length]}
                description={dim.description}
                factorCount={factors.length}
              />
            )
          })}
        </div>

        {/* CSS-only weight visualization bars */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Gewichtungsverteilung
          </h3>
          {RESIDENT_DIMENSIONS.map((dim, i) => {
            const pct = Math.round(dim.weight * 100)
            const barColors = [
              'bg-purple-500',
              'bg-blue-500',
              'bg-green-500',
              'bg-orange-500',
            ]
            return (
              <div key={dim.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-28 flex-shrink-0">{dim.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-10 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Score Scale */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-aoz-primary" />
          Score-Interpretation
        </h2>

        <p className="text-gray-600 mb-6">
          Der Kompatibilitäts-Score (0-100) zeigt, wie gut Bewohner zusammenpassen.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <ScoreLevel score="80-100" label="Sehr gut" color="green" action="Empfohlen" />
          <ScoreLevel score="60-79" label="Gut" color="emerald" action="Gute Option" />
          <ScoreLevel score="40-59" label="Mittel" color="yellow" action="Mit Begleitung" />
          <ScoreLevel score="20-39" label="Niedrig" color="orange" action="Vermeiden" />
          <ScoreLevel score="0-19" label="Kritisch" color="red" action="Blockiert" />
        </div>
      </section>

      {/* Version Footer */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Letzte Aktualisierung: v2.0 – 10. Februar 2026
      </div>
    </div>
  )
}
