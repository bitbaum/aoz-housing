/**
 * Shared layout for the account pages (/login, /register, /forgot-password,
 * /reset-password): the centered canvas. Page chrome lives in AuthShell.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ui-canvas flex items-center justify-center p-4">
      {children}
    </div>
  )
}
