import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import { BRAND } from '@/lib/config/brand'
import { MARKETING_COPY } from '@/lib/constants/labels'
import { NAV_ICONS } from '@/lib/config/navigation'
import { getAllPosts } from '@/lib/blog/posts'
import { formatCalendarDateLong } from '@/lib/utils/formatting'
import { BLOG_LABELS } from '@/lib/constants/labels'

/**
 * The landing page — what someone sees at the product's own address before
 * they have an account.
 *
 * Until now that address answered with a login form, which tells a visitor
 * nothing except that they are not welcome yet. Middleware rewrites `/` here
 * for anonymous visitors, so the URL stays the bare domain; signed-in people
 * never see it, because middleware sends them to their own side first.
 *
 * Prerendered: it reads brand config and the blog folder, never a session or
 * the database. @see lib/blog/posts.ts for why that has to stay true.
 */
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `${BRAND.productName} — ${BRAND.tagline}`,
  description: BRAND.metaDescription,
}

const C = MARKETING_COPY

export default function LandingPage() {
  const posts = getAllPosts().slice(0, 3)

  return (
    <div className="-my-8 sm:-my-12">
      <Hero />
      <Problems />
      <Steps />
      <Features />
      <Ethics />
      {posts.length > 0 && <FromTheBlog posts={posts} />}
      <Closing />
    </div>
  )
}

/* ── Sections ────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.eyebrow}</p>
      <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-display text-ui-text text-balance">
        {C.headline}
      </h1>
      <p className="mt-5 text-base sm:text-lg text-ui-muted max-w-2xl leading-relaxed">
        {C.subline}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* The demo is the primary action: it is the only claim on this page a
            visitor can check for themselves in one click. */}
        <Link href="/login#demo" className="btn-secondary">
          {C.ctaPrimary}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link href="/login" className="btn-outline">
          {C.ctaSecondary}
        </Link>
      </div>
      <p className="mt-3 text-sm text-ui-muted">{C.ctaNote}</p>
    </section>
  )
}

function Problems() {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.problemEyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text max-w-2xl text-balance">
        {C.problemTitle}
      </h2>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-ui-border border border-ui-border rounded-lg overflow-hidden">
        {C.problems.map((problem) => (
          <div key={problem.title} className="bg-ui-surface p-5">
            <h3 className="font-semibold text-ui-text">{problem.title}</h3>
            <p className="mt-2 text-sm text-ui-muted leading-relaxed">{problem.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.howEyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text max-w-2xl text-balance">
        {C.howTitle}
      </h2>

      <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {C.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            {/* The number is data about position, so it gets the tabular
                treatment the rest of the product's figures get. */}
            <span className="numeric text-sm text-ui-muted pt-0.5 tabular-nums" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="border-l border-ui-border pl-4">
              <h3 className="font-semibold text-ui-text">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ui-muted leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Features() {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.featuresEyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text max-w-2xl text-balance">
        {C.featuresTitle}
      </h2>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {C.features.map((feature) => {
          const Icon = NAV_ICONS[feature.icon]
          return (
            <div key={feature.title} className="card">
              <div className="flex items-start gap-3">
                {Icon && (
                  <span className="icon-container-sm shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                )}
                <div>
                  <h3 className="font-semibold text-ui-text">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-ui-muted leading-relaxed">{feature.body}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Ethics() {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.ethicsEyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text max-w-2xl text-balance">
        {C.ethicsTitle}
      </h2>
      <p className="mt-4 text-ui-muted max-w-2xl leading-relaxed">{C.ethicsBody}</p>

      <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl">
        {C.neverTracked.map((item) => (
          <li key={item} className="flex items-center gap-3 py-2 border-b border-ui-border">
            {/* A crossed-out item is the message: this is a list of things the
                system refuses to hold, not a feature list. */}
            <X className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" />
            <span className="text-sm text-ui-text line-through decoration-ui-border-strong">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FromTheBlog({ posts }: { posts: ReturnType<typeof getAllPosts> }) {
  return (
    <section className="py-14 sm:py-20 border-b border-ui-border">
      <p className="eyebrow">{C.blogEyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text max-w-2xl text-balance">
        {C.blogTitle}
      </h2>

      <ul className="mt-8 space-y-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="card-hover">
              <p className="eyebrow numeric">{formatCalendarDateLong(post.date)}</p>
              <h3 className="mt-1 font-semibold text-ui-text">{post.title}</h3>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-sm text-ui-text hover:text-brand-primary transition-colors">
        {C.blogLink}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
      <span className="sr-only">{BLOG_LABELS.title}</span>
    </section>
  )
}

function Closing() {
  return (
    <section className="py-14 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-heading text-ui-text text-balance">
        {C.closingTitle}
      </h2>
      <p className="mt-3 text-ui-muted max-w-2xl leading-relaxed">{C.closingBody}</p>

      <div className="mt-7 flex flex-col sm:flex-row gap-3">
        <Link href="/login#demo" className="btn-secondary">
          {C.ctaPrimary}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link href="/blog" className="btn-outline">
          {C.blogLink}
        </Link>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-ui-muted">
        <Check className="w-4 h-4 text-brand-secondary" aria-hidden="true" />
        {C.ctaNote}
      </p>
    </section>
  )
}
