/**
 * Seed — the real FitFoot catalog (Swiss-city product line carried over from
 * the original seed script, plus the homepage favorites with their prices),
 * one admin account, and a demo customer with an order.
 *
 * Run: npm run db:seed   (idempotent: skips if products exist)
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { hashPassword } from '@/lib/auth/passwords'
import { chfToRappen } from '@/lib/money'
import { generateOrderNumber } from '@/lib/orders/number'
import { includedVat } from '@/lib/cart/totals'

const { products, productVariants, customers, orders, orderItems, contactInquiries } = schema

interface SeedProduct {
  slug: string
  name: string
  category: string
  productType: 'NEW' | 'REFURBISHED'
  conditionGrade?: string
  gender: string
  priceChf: string
  compareAtChf?: string
  shortDescription: string
  description: string
  materials: string
  careInstructions: string
  sustainabilityNotes: string
  sustainabilityFeatures: string[]
  sizes: string[]
  skuPrefix: string
  color: string
}

const CATALOG: SeedProduct[] = [
  {
    slug: 'eco-trail-runner',
    name: 'Eco Trail Runner',
    category: 'RUNNING',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '179.00',
    compareAtChf: '249.00',
    shortDescription:
      'Recycled materials meet premium comfort. Perfect for daily runs and weekend adventures.',
    description:
      'Our best-selling trail runner combines recycled ocean plastics with a responsive natural-rubber sole. Breathable, light, and built for Swiss trails in every season.',
    materials: 'Recycled polyester mesh, natural rubber outsole, cork insole',
    careInstructions: 'Machine wash cold, air dry. Remove insoles before washing.',
    sustainabilityNotes: 'Saves 12kg CO₂ vs new production',
    sustainabilityFeatures: ['Eco-friendly materials', 'Recycled components', 'Carbon neutral shipping'],
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    skuPrefix: 'ETR',
    color: 'Forest Green',
  },
  {
    slug: 'urban-sneaker',
    name: 'Urban Sneaker',
    category: 'SNEAKERS',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '139.00',
    shortDescription:
      'Fresh design with organic cotton lining and recycled rubber sole. City-ready style.',
    description:
      'A clean, minimal sneaker for everyday city life. Organic cotton lining keeps feet comfortable all day; the recycled rubber sole is made from 70% reclaimed material.',
    materials: 'Organic cotton, recycled rubber, water-based adhesives',
    careInstructions: 'Wipe clean with a damp cloth. Air dry away from direct heat.',
    sustainabilityNotes: 'Made with 70% recycled materials',
    sustainabilityFeatures: ['Eco-friendly materials', 'Vegan materials', 'Biodegradable packaging'],
    sizes: ['37', '38', '39', '40', '41', '42', '43'],
    skuPrefix: 'URB',
    color: 'Ocean Blue',
  },
  {
    slug: 'refurb-hiking-boot',
    name: 'Refurb Hiking Boot',
    category: 'BOOTS',
    productType: 'REFURBISHED',
    conditionGrade: 'EXCELLENT',
    gender: 'UNISEX',
    priceChf: '89.00',
    compareAtChf: '219.00',
    shortDescription:
      'Premium hiking boot expertly restored. Waterproof, durable, and ready for adventure.',
    description:
      'Expertly restored by our craftspeople: deep-cleaned, re-soled where needed, waterproofing renewed, and quality-checked to new-shoe standards. Same mountains, bigger impact, better price.',
    materials: 'Full-grain leather (restored), Vibram sole, waterproof membrane',
    careInstructions: 'Clean with a brush, re-wax leather monthly in heavy use.',
    sustainabilityNotes: '95% less environmental impact',
    sustainabilityFeatures: ['Refurbished/Restored', 'Locally sourced'],
    sizes: ['40', '41', '42', '43', '44'],
    skuPrefix: 'RHB',
    color: 'Chestnut Brown',
  },
  {
    slug: 'alpine-trek-pro-hiking-boots',
    name: 'Alpine Trek Pro - Swiss Made Hiking Boots',
    category: 'BOOTS',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '289.00',
    shortDescription: 'Handcrafted Swiss hiking boots for serious mountain adventures.',
    description:
      'Handcrafted in Switzerland using sustainably sourced leather and recycled materials. These boots are designed for serious mountain adventures while minimizing environmental impact.',
    materials: 'Sustainably sourced leather, recycled hardware, natural rubber',
    careInstructions: 'Brush off dirt, condition leather regularly, re-proof seasonally.',
    sustainabilityNotes: 'Swiss made — minimal transport footprint',
    sustainabilityFeatures: ['Locally sourced', 'Eco-friendly materials', 'Fair trade certified'],
    sizes: ['39', '40', '41', '42', '43'],
    skuPrefix: 'ATP',
    color: 'Brown',
  },
  {
    slug: 'zurich-urban-eco-sneakers',
    name: 'Zurich Urban - Eco-Friendly City Sneakers',
    category: 'SNEAKERS',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '159.00',
    shortDescription: 'Modern urban sneakers from recycled ocean plastic and organic hemp.',
    description:
      'Modern urban sneakers crafted from recycled ocean plastic and organic hemp. Perfect for city life with Swiss precision manufacturing and minimal carbon footprint.',
    materials: 'Recycled ocean plastic, organic hemp, recycled rubber',
    careInstructions: 'Machine wash cold in a laundry bag, air dry.',
    sustainabilityNotes: 'Ocean plastic given a second life',
    sustainabilityFeatures: ['Recycled components', 'Vegan materials', 'Carbon neutral shipping'],
    sizes: ['38', '39', '40', '41', '42'],
    skuPrefix: 'ZUR',
    color: 'Ocean',
  },
  {
    slug: 'basel-work-safety-boots',
    name: 'Basel Work - Sustainable Safety Boots',
    category: 'BOOTS',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '229.00',
    shortDescription: 'Professional safety boots meeting Swiss workplace standards.',
    description:
      'Professional safety boots meeting Swiss workplace standards. Made with sustainably sourced materials and designed for long-lasting durability in industrial environments.',
    materials: 'Sustainably sourced leather, steel toe, anti-slip recycled sole',
    careInstructions: 'Wipe clean daily, condition leather weekly in heavy use.',
    sustainabilityNotes: 'Built to last decades, not seasons',
    sustainabilityFeatures: ['Locally sourced', 'Eco-friendly materials'],
    sizes: ['40', '41', '42', '43', '44'],
    skuPrefix: 'BSL',
    color: 'Steel',
  },
  {
    slug: 'matterhorn-winter-snow-boots',
    name: 'Matterhorn Winter - Insulated Snow Boots',
    category: 'BOOTS',
    productType: 'NEW',
    gender: 'UNISEX',
    priceChf: '249.00',
    shortDescription: 'Insulated, waterproof boots designed for harsh Swiss winters.',
    description:
      'Designed for harsh Swiss winters with premium insulation and waterproof membrane. Made with responsibly sourced materials and built to last decades in extreme conditions.',
    materials: 'Responsibly sourced leather, recycled insulation, waterproof membrane',
    careInstructions: 'Dry at room temperature, never on a radiator. Re-proof before each season.',
    sustainabilityNotes: 'Responsibly sourced, built for decades',
    sustainabilityFeatures: ['Eco-friendly materials', 'Locally sourced'],
    sizes: ['38', '39', '40', '41', '42'],
    skuPrefix: 'MTH',
    color: 'Chocolate',
  },
  {
    slug: 'geneva-formal-dress-shoes',
    name: 'Geneva Formal - Sustainable Dress Shoes',
    category: 'FORMAL',
    productType: 'NEW',
    gender: 'MEN',
    priceChf: '269.00',
    shortDescription: 'Sophisticated dress shoes with vegetable-tanned leather and cork soles.',
    description:
      'Sophisticated dress shoes crafted with vegetable-tanned leather and cork soles. Perfect for business settings while maintaining our commitment to environmental responsibility.',
    materials: 'Vegetable-tanned leather, cork sole, hand-finished',
    careInstructions: 'Use shoe trees, polish with natural wax, resole when worn.',
    sustainabilityNotes: 'Vegetable tanning — no chrome, no heavy metals',
    sustainabilityFeatures: ['Eco-friendly materials', 'Fair trade certified'],
    sizes: ['39', '40', '41', '42', '43'],
    skuPrefix: 'GNV',
    color: 'Oxford Black',
  },
]

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://fitfoot:fitfoot@localhost:5432/fitfoot'
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  const existing = await db.select({ id: products.id }).from(products).limit(1)
  if (existing.length > 0) {
    console.log('Seed skipped: products already exist.')
    await pool.end()
    return
  }

  // --- Catalog ---
  for (const p of CATALOG) {
    const [created] = await db
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        category: p.category,
        productType: p.productType,
        conditionGrade: p.conditionGrade ?? null,
        gender: p.gender,
        shortDescription: p.shortDescription,
        description: p.description,
        materials: p.materials,
        careInstructions: p.careInstructions,
        origin: 'Switzerland',
        sustainabilityNotes: p.sustainabilityNotes,
        sustainabilityFeatures: p.sustainabilityFeatures,
        priceRappen: chfToRappen(p.priceChf),
        compareAtRappen: p.compareAtChf ? chfToRappen(p.compareAtChf) : null,
        imageUrl: '',
      })
      .returning({ id: products.id })

    await db.insert(productVariants).values(
      p.sizes.map((size) => ({
        productId: created.id,
        sku: `${p.skuPrefix}-${size}-${p.color.split(' ')[0].toUpperCase().slice(0, 3)}`,
        size,
        color: p.color,
        stockQty: p.productType === 'REFURBISHED' ? 1 : 8,
      }))
    )
  }

  // --- Admin account ---
  const adminEmail = 'admin@fitfoot.ch'
  const [admin] = await db
    .insert(customers)
    .values({
      email: adminEmail,
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? 'fitfoot-admin-2026'),
      firstName: 'FitFoot',
      lastName: 'Admin',
      role: 'ADMIN',
    })
    .returning({ id: customers.id })
  console.log(`Admin: ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ?? 'fitfoot-admin-2026'}`)

  // --- Demo customer with an order (so the CRM is not empty) ---
  const [anna] = await db
    .insert(customers)
    .values({
      email: 'anna.mueller@example.com',
      firstName: 'Anna',
      lastName: 'Müller',
      phone: '+41 79 123 45 67',
      newsletterOptIn: true,
    })
    .returning({ id: customers.id })

  const [trail] = await db.select().from(products).where(eq(products.slug, 'eco-trail-runner')).limit(1)
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, trail.id))
    .limit(1)

  const subtotalRappen = trail.priceRappen
  const shippingRappen = 0 // over CHF 100
  const totalRappen = subtotalRappen + shippingRappen
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      customerId: anna.id,
      email: 'anna.mueller@example.com',
      status: 'PAID',
      subtotalRappen,
      shippingMethod: 'STANDARD',
      shippingRappen,
      vatRappen: includedVat(totalRappen),
      totalRappen,
      shipName: 'Anna Müller',
      shipStreet: 'Bahnhofstrasse 123',
      shipZip: '8001',
      shipCity: 'Zürich',
      shipCountry: 'CH',
    })
    .returning({ id: orders.id, orderNumber: orders.orderNumber })

  await db.insert(orderItems).values({
    orderId: order.id,
    productId: trail.id,
    variantId: variant.id,
    productName: trail.name,
    size: variant.size,
    color: variant.color,
    unitPriceRappen: trail.priceRappen,
    quantity: 1,
  })

  await db.insert(contactInquiries).values({
    name: 'Marco Rossi',
    email: 'marco.rossi@example.com',
    subject: 'Trade-in program',
    message: 'Hi! I have two pairs of old hiking boots — can I send them in for the trade-in discount?',
  })

  console.log(`Seeded ${CATALOG.length} products, demo order ${order.orderNumber}, 1 inquiry.`)
  console.log(`Admin user id: ${admin.id}`)
  await pool.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
