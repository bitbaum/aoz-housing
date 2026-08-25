'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  MARKETPLACE_KINDS,
  MARKETPLACE_KIND_VALUES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CATEGORY_LABEL_KEYS,
  MARKETPLACE_NATURE_LABEL_KEYS,
  MARKETPLACE_NATURES,
  natureOfKind,
} from '@/lib/config/marketplace'
import { useT } from '@/lib/i18n/LocaleProvider'
import type { MarketplacePostKind } from '@prisma/client'

/**
 * Posting form for the marketplace.
 *
 * Client-side for one reason: the category list depends on the kind. Offering
 * "Möbel" under an offer to translate a letter is how a board ends up with
 * half its rows in the wrong half of itself, and a server-rendered <select>
 * cannot narrow as you choose.
 *
 * Collapsed by default. It used to sit permanently open above the listings,
 * which meant the page led with a form instead of with what the house
 * currently has going — the reason to come back is the second thing you see.
 */
export function MarketplacePostForm({ action }: { action: (formData: FormData) => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<MarketplacePostKind>('GIVE_AWAY')
  const nature = natureOfKind(kind)
  const categories = MARKETPLACE_CATEGORIES[nature]

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full min-h-[44px] items-center justify-between gap-2 text-start"
      >
        <span className="text-lg font-semibold text-ui-text">{t('marketplace.postNew')}</span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-ui-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <form action={action} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="mp-kind" className="label">{t('marketplace.formKind')}</label>
            <select
              id="mp-kind"
              name="kind"
              required
              className="input"
              value={kind}
              onChange={(event) => setKind(event.target.value as MarketplacePostKind)}
            >
              {MARKETPLACE_NATURES.map((group) => (
                <optgroup key={group} label={t(MARKETPLACE_NATURE_LABEL_KEYS[group])}>
                  {MARKETPLACE_KIND_VALUES.filter(
                    (value) => MARKETPLACE_KINDS[value].nature === group
                  ).map((value) => (
                    <option key={value} value={value}>
                      {t(MARKETPLACE_KINDS[value].labelKey)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mp-title" className="label">{t('marketplace.formTitle')}</label>
            <input id="mp-title" name="title" required maxLength={120} className="input" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mp-description" className="label">{t('marketplace.formDescription')}</label>
            <textarea id="mp-description" name="description" required rows={3} maxLength={2000} className="input" />
          </div>

          <div>
            <label htmlFor="mp-category" className="label">{t('marketplace.formCategory')}</label>
            {/* Keyed on the nature so switching between halves resets the
                choice rather than carrying a now-invalid value across. */}
            <select key={nature} id="mp-category" name="category" className="input" defaultValue="OTHER">
              {categories.map((value) => (
                <option key={value} value={value}>
                  {t(MARKETPLACE_CATEGORY_LABEL_KEYS[value])}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mp-contact" className="label">{t('marketplace.formContact')}</label>
            <input id="mp-contact" name="contactNote" maxLength={200} className="input" />
            <p className="mt-1 text-xs text-ui-muted">{t('marketplace.formContactHint')}</p>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary min-h-[44px] px-6">
              {t('marketplace.submit')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost min-h-[44px] px-4"
            >
              {t('action.cancel')}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
