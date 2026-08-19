import { logoutAction } from '@/lib/actions/auth'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn-ghost text-sm">
        Sign out
      </button>
    </form>
  )
}
