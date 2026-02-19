import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-aoz-background">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-gray-400">404</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Seite nicht gefunden
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2 bg-aoz-primary text-white rounded-md hover:bg-aoz-primary-dark min-h-[44px] transition-colors"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
