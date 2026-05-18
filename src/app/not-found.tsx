import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-aoz-background">
      <div className="max-w-md p-8 bg-ui-surface rounded-lg shadow-card text-center">
        <div className="w-16 h-16 bg-ui-subtle rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-ui-muted">404</span>
        </div>
        <h1 className="text-xl font-semibold text-ui-text mb-2">
          Seite nicht gefunden
        </h1>
        <p className="text-ui-muted mb-6 text-sm">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/"
          className="btn-primary px-6"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
