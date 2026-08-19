import Link from 'next/link'
import type { Metadata } from 'next'
import { IMPACT_STATS, TAKE_BACK } from '@/config/site'

export const metadata: Metadata = {
  title: 'Sustainability',
}

const QUALITY_PROCESS = [
  { title: 'Design', body: 'User-centered design meets functional innovation' },
  { title: 'Materials', body: 'Carefully sourced premium materials that last' },
  { title: 'Craft', body: 'Skilled artisans bring each design to life' },
  { title: 'Testing', body: 'Rigorous quality control at every stage' },
  { title: 'Delivery', body: 'Packaged with care for the perfect unboxing' },
] as const

export default function SustainabilityPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-4xl sm:text-5xl">
        Products built to <span className="gold-text-gradient">last forever</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-muted">
        Where precision meets purpose. Every product represents our commitment to exceptional
        quality and environmental responsibility.
      </p>

      {/* Take-back program */}
      <section className="mt-16 rounded border border-line p-8 sm:p-10">
        <h2 className="font-heading text-3xl">{TAKE_BACK.headline}</h2>
        <p className="mt-3 max-w-2xl text-muted">{TAKE_BACK.sub}</p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TAKE_BACK.steps.map((step, index) => (
            <li key={step.title}>
              <span className="gold-gradient flex h-10 w-10 items-center justify-center rounded-full font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/contact" className="btn-gold">
            Request Trade-In Kit
          </Link>
        </div>
      </section>

      {/* Impact */}
      <section className="mt-16 text-center">
        <h2 className="font-heading text-3xl">Environmental impact</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {IMPACT_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="gold-text-gradient font-heading text-5xl">{stat.value}</p>
              <p className="mt-2 text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality process */}
      <section className="mt-16">
        <h2 className="text-center font-heading text-3xl">Our quality process</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {QUALITY_PROCESS.map((step, index) => (
            <li key={step.title} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-500 font-bold text-gold-600">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 text-center">
        <h2 className="font-heading text-3xl">
          Ready to experience <span className="gold-text-gradient">lasting quality?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Discover footwear that&apos;s built to last, designed to perform, and created with respect
          for our planet. Your perfect pair is waiting.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn-gold">
            Shop All Collections
          </Link>
          <Link href="/contact" className="btn-outline-gold">
            Start Trade-In Program
          </Link>
        </div>
      </section>
    </div>
  )
}
