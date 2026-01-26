import Link from 'next/link'
import {
  Brain,
  Users,
  Home,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight
} from 'lucide-react'

export const metadata = {
  title: 'Algorithmus - AOZ Wohnen',
  description: 'Wie das Kompatibilitäts-Matching funktioniert',
}

export default function AlgorithmPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-aoz-primary mb-2 inline-block"
        >
          ← Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-aoz-primary" />
          Kompatibilitäts-Algorithmus
        </h1>
        <p className="text-gray-600 mt-2">
          Wie das System passende Platzierungen findet
        </p>
      </div>

      {/* Overview */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Übersicht
        </h2>
        <p className="text-gray-700 mb-4">
          Der Algorithmus bewertet die Kompatibilität zwischen Bewohnern anhand von vier Dimensionen.
          Jede Dimension hat ein Gewicht, das ihre Wichtigkeit für ein harmonisches Zusammenleben widerspiegelt.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DimensionCard
            name="Lebensstil"
            weight={30}
            color="bg-purple-100 text-purple-700"
            factors={['Schlafrhythmus', 'Lärmtoleranz', 'Sauberkeit']}
          />
          <DimensionCard
            name="Soziales"
            weight={25}
            color="bg-blue-100 text-blue-700"
            factors={['Sprachen', 'Sozialstil', 'Privatsphäre']}
          />
          <DimensionCard
            name="Praktisches"
            weight={25}
            color="bg-green-100 text-green-700"
            factors={['Rauchen', 'Hausarbeit', 'Ernährung']}
          />
          <DimensionCard
            name="Risiko"
            weight={20}
            color="bg-orange-100 text-orange-700"
            factors={['Konfliktindikatoren', 'Nachtruhe', 'Raumteilung']}
          />
        </div>
      </section>

      {/* Score Interpretation */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-green-500" />
          Score-Interpretation
        </h2>
        <p className="text-gray-700 mb-4">
          Der Gesamtscore (0-100) zeigt, wie gut zwei Bewohner zusammenpassen:
        </p>
        <div className="space-y-3">
          <ScoreBar score="80-100" label="Sehr gut" color="bg-green-500" desc="Empfohlene Platzierung" />
          <ScoreBar score="60-79" label="Gut" color="bg-emerald-500" desc="Gute Option" />
          <ScoreBar score="40-59" label="Mittel" color="bg-yellow-500" desc="Mit Unterstützung möglich" />
          <ScoreBar score="20-39" label="Niedrig" color="bg-orange-500" desc="Vermeiden wenn möglich" />
          <ScoreBar score="0-19" label="Kritisch" color="bg-red-500" desc="Nicht zusammen platzieren" />
        </div>
      </section>

      {/* Lifestyle Dimension */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">30%</span>
          Lebensstil-Dimension
        </h2>
        <div className="space-y-4">
          <FactorExplainer
            name="Schlafrhythmus"
            weight="40%"
            description="Frühaufsteher, Normal, oder Nachtmensch"
            rules={[
              { condition: 'Gleicher Rhythmus', result: '100 Punkte' },
              { condition: 'Einer ist flexibel (Normal)', result: '70 Punkte' },
              { condition: 'Frühaufsteher + Nachtmensch', result: '30 Punkte', warning: true },
            ]}
          />
          <FactorExplainer
            name="Lärmtoleranz"
            weight="30%"
            description="Skala 1-5 (1=sehr empfindlich, 5=sehr tolerant)"
            rules={[
              { condition: 'Gleiche Toleranz', result: '100 Punkte' },
              { condition: 'Pro Stufe Unterschied', result: '-20 Punkte' },
              { condition: '3+ Stufen Unterschied', result: 'Konflikt-Warnung', warning: true },
            ]}
          />
          <FactorExplainer
            name="Sauberkeit"
            weight="30%"
            description="Skala 1-5 (1=wenig wichtig, 5=sehr wichtig)"
            rules={[
              { condition: 'Gleiche Stufe', result: '100 Punkte' },
              { condition: 'Pro Stufe Unterschied', result: '-20 Punkte' },
              { condition: '3+ Stufen Unterschied', result: 'BLOCKIERT', warning: true },
            ]}
          />
        </div>
      </section>

      {/* Social Dimension */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">25%</span>
          Soziale Dimension
        </h2>
        <div className="space-y-4">
          <FactorExplainer
            name="Sprachen"
            weight="40%"
            description="Gemeinsame Kommunikation"
            rules={[
              { condition: '2+ gemeinsame Sprachen', result: '100 Punkte' },
              { condition: 'Deutsch oder Englisch gemeinsam', result: '100 Punkte' },
              { condition: 'Einer spricht Lingua Franca', result: '50-75 Punkte' },
              { condition: 'Keine gemeinsame Sprache', result: '25 Punkte', warning: true },
            ]}
          />
          <FactorExplainer
            name="Sozialstil"
            weight="35%"
            description="Introvertiert, Ausgeglichen, oder Extrovertiert"
            rules={[
              { condition: 'Gleicher Stil', result: '100 Punkte' },
              { condition: 'Einer ist Ausgeglichen', result: '80 Punkte' },
              { condition: 'Introvertiert + Extrovertiert', result: '60 Punkte' },
            ]}
          />
          <FactorExplainer
            name="Privatsphäre"
            weight="25%"
            description="Skala 1-5 (1=wenig, 5=viel Bedarf)"
            rules={[
              { condition: 'Gleicher Bedarf', result: '100 Punkte' },
              { condition: 'Pro Stufe Unterschied', result: '-15 Punkte' },
            ]}
          />
        </div>
      </section>

      {/* Practical Dimension */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">25%</span>
          Praktische Dimension
        </h2>
        <div className="space-y-4">
          <FactorExplainer
            name="Rauchen"
            weight="40%"
            description="Nichtraucher, Draussen-Raucher, oder Innen-Raucher"
            rules={[
              { condition: 'Gleicher Status', result: '100 Punkte' },
              { condition: 'Nichtraucher + Draussen-Raucher', result: '80 Punkte' },
              { condition: 'Nichtraucher + Innen-Raucher', result: '20 Punkte', warning: true },
            ]}
          />
          <FactorExplainer
            name="Hausarbeit"
            weight="20%"
            description="Bereitschaft zur Mitarbeit (Skala 1-5)"
            rules={[
              { condition: 'Gleiche Bereitschaft', result: '100 Punkte' },
              { condition: 'Pro Stufe Unterschied', result: '-20 Punkte' },
              { condition: '3+ Stufen Unterschied', result: 'Konflikt-Warnung', warning: true },
            ]}
          />
          <FactorExplainer
            name="Ernährung"
            weight="15%"
            description="Besondere Bedürfnisse (Halal, Vegetarisch, etc.)"
            rules={[
              { condition: 'Gleiche Bedürfnisse', result: '100 Punkte' },
              { condition: 'Unterschiedliche Bedürfnisse', result: '75 Punkte' },
            ]}
          />
        </div>
      </section>

      {/* Risk Dimension */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-sm font-bold">20%</span>
          Risiko-Dimension
        </h2>
        <p className="text-gray-700 mb-4">
          Die Risiko-Dimension identifiziert potenzielle Konfliktquellen.
          Ein <strong>niedriger</strong> Risikowert bedeutet <strong>höhere</strong> Kompatibilität.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RiskFactor factor="Grosser Altersunterschied" risk="Mittel" />
          <RiskFactor factor="Keine gemeinsame Sprache" risk="Hoch" />
          <RiskFactor factor="Raucher-Konflikt" risk="Hoch" />
          <RiskFactor factor="Schlafrhythmus-Konflikt" risk="Mittel" />
          <RiskFactor factor="Extreme Sauberkeits-Differenz" risk="Hoch" />
          <RiskFactor factor="Nachtruhe-Bedarf + Nachtstörungen" risk="Hoch" />
          <RiskFactor factor="Privatzimmer-Bedarf nicht erfüllt" risk="Kritisch" />
          <RiskFactor factor="Grosser Hausarbeits-Unterschied" risk="Mittel" />
        </div>
      </section>

      {/* Apartment Aggregate */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-indigo-500" />
          Wohnungs-Profil
        </h2>
        <p className="text-gray-700 mb-4">
          Bei besetzten Wohnungen berechnet das System ein Durchschnittsprofil aller aktuellen Bewohner:
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-indigo-900 mb-2">Aggregierte Metriken</h3>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• Durchschnittliche Sauberkeit, Lärmtoleranz, Privatsphäre</li>
            <li>• Dominanter Schlafrhythmus (Mehrheit)</li>
            <li>• Gemeinsame Sprachen (von 2+ Bewohnern gesprochen)</li>
            <li>• Prozentsatz mit Nachtruhe-Bedarf</li>
          </ul>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Konflikt-Schwellenwerte</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Attribut</th>
                <th className="text-center py-2 px-2">BLOCKIERT</th>
                <th className="text-center py-2 px-2">Hoch</th>
                <th className="text-center py-2 px-2">Mittel</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b">
                <td className="py-2 pr-4">Sauberkeits-Differenz</td>
                <td className="text-center py-2 px-2 text-red-600 font-medium">≥3 Stufen</td>
                <td className="text-center py-2 px-2 text-orange-600">≥2 Stufen</td>
                <td className="text-center py-2 px-2 text-yellow-600">≥1.5 Stufen</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Lärmtoleranz-Differenz</td>
                <td className="text-center py-2 px-2">—</td>
                <td className="text-center py-2 px-2 text-orange-600">≥3 Stufen</td>
                <td className="text-center py-2 px-2 text-yellow-600">≥2 Stufen</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Hausarbeits-Differenz</td>
                <td className="text-center py-2 px-2">—</td>
                <td className="text-center py-2 px-2">—</td>
                <td className="text-center py-2 px-2 text-yellow-600">≥3 Stufen</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Nachtstörungen %</td>
                <td className="text-center py-2 px-2">—</td>
                <td className="text-center py-2 px-2 text-orange-600">≥30%</td>
                <td className="text-center py-2 px-2">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Blocking Mechanism */}
      <section className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Blockierung
        </h2>
        <p className="text-gray-700 mb-4">
          Bei kritischen Inkompatibilitäten wird die Platzierung <strong>blockiert</strong>:
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span><strong>Sauberkeit:</strong> 3+ Stufen Unterschied zum Wohnungs-Durchschnitt</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span><strong>Privatzimmer:</strong> Bedarf kann nicht erfüllt werden</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <span><strong>Kritische Konflikte:</strong> Mehrere schwerwiegende Inkompatibilitäten</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <section className="text-center text-gray-500 text-sm py-8">
        <p>
          Dieser Algorithmus wurde entwickelt, um Konflikte zu reduzieren und das Wohlbefinden zu fördern.
        </p>
        <p className="mt-2">
          <Link href="/matching" className="text-aoz-primary hover:underline">
            Matching starten →
          </Link>
        </p>
      </section>
    </div>
  )
}

function DimensionCard({
  name,
  weight,
  color,
  factors
}: {
  name: string
  weight: number
  color: string
  factors: string[]
}) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{weight}%</div>
      <div className="font-medium">{name}</div>
      <ul className="text-xs mt-2 space-y-0.5 opacity-80">
        {factors.map(f => <li key={f}>• {f}</li>)}
      </ul>
    </div>
  )
}

function ScoreBar({
  score,
  label,
  color,
  desc
}: {
  score: string
  label: string
  color: string
  desc: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-20 h-2 rounded-full ${color}`} />
      <span className="font-medium w-16">{score}</span>
      <span className="font-medium w-20">{label}</span>
      <span className="text-gray-500 text-sm">{desc}</span>
    </div>
  )
}

function FactorExplainer({
  name,
  weight,
  description,
  rules
}: {
  name: string
  weight: string
  description: string
  rules: { condition: string; result: string; warning?: boolean }[]
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{weight}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="space-y-1">
        {rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {rule.warning ? (
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
            ) : (
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-gray-700">{rule.condition}</span>
            <span className="text-gray-400">→</span>
            <span className={rule.warning ? 'text-orange-600 font-medium' : 'text-gray-900'}>
              {rule.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskFactor({ factor, risk }: { factor: string; risk: string }) {
  const colors = {
    'Mittel': 'bg-yellow-100 text-yellow-700',
    'Hoch': 'bg-orange-100 text-orange-700',
    'Kritisch': 'bg-red-100 text-red-700',
  }
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-700">{factor}</span>
      <span className={`text-xs px-2 py-1 rounded font-medium ${colors[risk as keyof typeof colors]}`}>
        {risk}
      </span>
    </div>
  )
}
