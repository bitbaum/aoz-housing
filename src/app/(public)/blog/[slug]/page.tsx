import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'
import { renderMarkdown } from '@/lib/blog/markdown'
import { BLOG_LABELS } from '@/lib/constants/labels'
import { formatCalendarDateLong } from '@/lib/utils/formatting'

// Every post is prerendered from the repo at build time, and an unknown slug
// 404s from the static shell rather than trying to render on the box — where
// `docs/` does not exist. @see lib/blog/posts.ts
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      url: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article>
      <header className="mb-8 pb-8 border-b border-ui-border">
        <p className="eyebrow numeric">
          {BLOG_LABELS.published} <time dateTime={post.date}>{formatCalendarDateLong(post.date)}</time>
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ui-text mt-2">{post.title}</h1>
      </header>

      {/* Trusted input: the markdown is committed to this repo and reviewed in
          a pull request. @see lib/blog/markdown.ts */}
      <div className="prose-post" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />

      <nav className="mt-12 pt-8 border-t border-ui-border">
        <Link href="/blog" className="btn-ghost text-sm">
          {BLOG_LABELS.backToIndex}
        </Link>
      </nav>
    </article>
  )
}
