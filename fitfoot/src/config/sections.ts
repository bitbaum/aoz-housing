/**
 * Admin section registry — the evig pattern: each entry is simultaneously a
 * URL path, a sidebar entry, a dashboard card and (when we grow past two
 * role tiers) a permission key. Adding an admin surface = adding one entry.
 */
export interface AdminSection {
  id: string
  path: string
  label: string
  description: string
  emoji: string
}

export const ADMIN_SECTIONS = {
  dashboard: {
    id: 'dashboard',
    path: '/admin',
    label: 'Dashboard',
    description: 'Orders needing attention, revenue, low stock',
    emoji: '📊',
  },
  orders: {
    id: 'orders',
    path: '/admin/orders',
    label: 'Orders',
    description: 'Order queue and status management',
    emoji: '📦',
  },
  customers: {
    id: 'customers',
    path: '/admin/customers',
    label: 'Customers',
    description: 'Customer records, order history, notes',
    emoji: '👥',
  },
  products: {
    id: 'products',
    path: '/admin/products',
    label: 'Products',
    description: 'Catalog, variants and stock',
    emoji: '👟',
  },
  inquiries: {
    id: 'inquiries',
    path: '/admin/inquiries',
    label: 'Inquiries',
    description: 'Contact form inbox',
    emoji: '✉️',
  },
  newsletter: {
    id: 'newsletter',
    path: '/admin/newsletter',
    label: 'Newsletter',
    description: 'Subscriber list and export',
    emoji: '📣',
  },
} as const satisfies Record<string, AdminSection>

export type AdminSectionId = keyof typeof ADMIN_SECTIONS

export const ADMIN_SECTION_LIST: readonly AdminSection[] = Object.values(ADMIN_SECTIONS)
