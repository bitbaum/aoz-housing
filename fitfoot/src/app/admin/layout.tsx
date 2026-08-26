import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireStaff, AuthError } from '@/lib/auth/guards'
import { ADMIN_SECTION_LIST } from '@/config/sections'
import { SITE } from '@/config/site'
import { AdminNav } from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let staff
  try {
    staff = await requireStaff()
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(error.status === 401 ? '/login?next=/admin' : '/')
    }
    throw error
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-3 flex items-center justify-between lg:mb-0 lg:block">
          <div>
            <p className="font-heading text-lg">{SITE.name} Admin</p>
            <p className="text-xs text-muted">
              {staff.firstName} {staff.lastName} · {staff.role}
            </p>
          </div>
          <Link href="/" className="btn-ghost text-sm lg:hidden">
            ← Shop
          </Link>
        </div>
        <AdminNav sections={ADMIN_SECTION_LIST.map(({ id, path, label, emoji }) => ({ id, path, label, emoji }))} />
        <Link href="/" className="btn-ghost mt-4 hidden w-full text-sm lg:flex">
          ← Back to shop
        </Link>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
