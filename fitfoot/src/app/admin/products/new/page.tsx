import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'

export default function AdminNewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
        ← All products
      </Link>
      <h1 className="mt-2 font-heading text-3xl">New product</h1>
      <div className="mt-6 max-w-2xl">
        <ProductForm />
      </div>
    </div>
  )
}
