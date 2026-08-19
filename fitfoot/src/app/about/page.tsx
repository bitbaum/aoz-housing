import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { OUR_STORY, VALUES } from '@/config/site'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-4xl sm:text-5xl">
        Swiss quality, <span className="gold-text-gradient">lasting design</span>
      </h1>

      <section className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-lg border border-line shadow-card">
          <Image
            src="/brand/our-story-sneaker.jpg"
            alt="A FitFoot leather sneaker, studio photographed"
            width={2400}
            height={1600}
            className="h-full w-full object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
        <div>
          <p className="eyebrow">Our story</p>
          <div className="mt-3 space-y-4 text-ink">
            {OUR_STORY.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center font-heading text-3xl">Our values</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
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
