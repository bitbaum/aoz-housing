import Link from 'next/link'
import type { Metadata } from 'next'
import { OUR_STORY, VALUES } from '@/config/site'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-4xl sm:text-5xl">
        Swiss quality, <span className="gold-text-gradient">lasting design</span>
      </h1>

      <section className="mt-16">
        <h2 className="font-heading text-3xl">Our story</h2>
        <div className="mt-6 space-y-4 text-ink">
          {OUR_STORY.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-3xl">Our values</h2>
        <p className="mt-3 text-muted">
          These principles guide everything we do, from design to production to customer service.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div key={value.title} className="card">
              <h3 className="font-heading text-xl">{value.title}</h3>
              <p className="mt-2 text-sm text-muted">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded bg-subtle p-10 text-center">
        <h2 className="font-heading text-3xl">
          Ready to experience <span className="gold-text-gradient">premium quality?</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Join thousands of customers who trust FitFoot for premium footwear that combines
          exceptional design with superior craftsmanship.
        </p>
        <Link href="/shop" className="btn-gold mt-6">
          Shop the collection
        </Link>
      </section>
    </div>
  )
}
