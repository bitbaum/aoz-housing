import type { Metadata } from 'next'
import { SITE } from '@/config/site'
import { ContactForm } from '@/components/shop/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-center font-heading text-4xl sm:text-5xl">Get in Touch</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-muted">
        Have questions about our products or want to learn more about FitFoot? We&apos;d love to
        hear from you.
      </p>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-heading text-2xl">Contact information</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="font-semibold">Email</dt>
              <dd className="mt-1 text-muted">
                <a href={`mailto:${SITE.contactEmail}`} className="hover:text-gold-600">
                  {SITE.contactEmail}
                </a>
                <br />
                <a href={`mailto:${SITE.supportEmail}`} className="hover:text-gold-600">
                  {SITE.supportEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Location</dt>
              <dd className="mt-1 text-muted">
                Switzerland
                <br />
                Designed with Swiss precision
              </dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>
    </div>
  )
}
