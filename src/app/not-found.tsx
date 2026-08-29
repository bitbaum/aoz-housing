import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background">
      <div className="max-w-md p-8 bg-ui-surface rounded-lg border border-ui-border text-center">
        <div className="icon-container-lg mx-auto mb-6 h-16 w-16">
          <span className="text-3xl text-ui-muted">404</span>
        </div>
        <h1 className="text-xl font-semibold text-ui-text mb-2">Seite nicht gefunden</h1>
        <p className="text-ui-muted mb-6 text-sm">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link href="/" className="btn-primary px-6">
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
