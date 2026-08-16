/**
 * Chrome for the public engineering blog.
 *
 * The chrome is German like the rest of the product; the posts themselves are
 * English, because they are engineering writing and the repo's language rule
 * puts docs in English. That split is deliberate rather than an oversight: the
 * navigation belongs to the app, the prose belongs to `docs/blog/`.
 */
export const BLOG_LABELS = {
  title: 'Engineering-Blog',
  subtitle: 'Warum das Produkt so gebaut ist, wie es ist',
  allPosts: 'Alle Beiträge',
  backToIndex: 'Zurück zum Blog',
  toApp: 'Zur Anmeldung',
  empty: 'Noch keine Beiträge.',
  /** Shown under the post title, before the date. */
  published: 'Veröffentlicht',
  readMore: 'Weiterlesen',
} as const
