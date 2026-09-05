import Link from 'next/link'

/**
 * "Which half of my domain am I looking at" — one definition, shared by
 * `/learning` and `/opportunities`.
 *
 * Both pages split the integration domain the same way, so they must LOOK the
 * same way too: a coach who learns the control on one page has learned it on
 * the other. It was inline markup on `/learning` only, in `rounded-full` — the
 * shape this design system reserves for true circles, because a rounded cap on
 * something with padding reads as a pill rather than a state.
 */

export interface BoardSwitcherItem {
  id: string
  label: string
  href: string
}

interface Props {
  items: readonly BoardSwitcherItem[]
  current: string
  /** Names the group for screen readers — "Bereich", "Ansicht". */
  label: string
}

export function BoardSwitcher({ items, current, label }: Props) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.id === current
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-[44px] items-center rounded-lg border px-4 text-sm font-medium transition-colors ${
              active
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-ui-border text-ui-muted hover:border-brand-primary/30 hover:text-ui-text'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
