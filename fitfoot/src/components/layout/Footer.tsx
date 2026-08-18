import Link from 'next/link'
import { SITE } from '@/config/site'
import { NewsletterForm } from './NewsletterForm'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-heading text-xl">{SITE.name}</p>
          <p className="mt-3 text-sm text-neutral-600">
            Premium Swiss footwear that&apos;s kind to your feet and the planet.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-neutral-600 hover:text-gold-600">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop?type=NEW" className="text-neutral-600 hover:text-gold-600">
                New collection
              </Link>
            </li>
            <li>
              <Link href="/shop?type=REFURBISHED" className="text-neutral-600 hover:text-gold-600">
                Refurbished
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-neutral-600 hover:text-gold-600">
                About
              </Link>
            </li>
            <li>
              <Link href="/sustainability" className="text-neutral-600 hover:text-gold-600">
                Sustainability
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-neutral-600 hover:text-gold-600">
                Contact
              </Link>
            </li>
            <li>
              <a href={`mailto:${SITE.contactEmail}`} className="text-neutral-600 hover:text-gold-600">
                {SITE.contactEmail}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Stay in the loop
          </p>
          <p className="mt-3 text-sm text-neutral-600">
            New drops, trade-in offers, no spam.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500">
        {SITE.copyright}
      </div>
    </footer>
  )
}
