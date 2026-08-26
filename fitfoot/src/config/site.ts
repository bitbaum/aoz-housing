/**
 * Site copy & brand facts — SSOT. The storefront reads from here; no page
 * hardcodes brand claims. Copy carried over from the original FitFoot.
 */
export const SITE = {
  name: 'FitFoot',
  domain: 'fitfoot.ch',
  title: 'FitFoot - Sustainable Footwear That Feels Good | Swiss Quality',
  titleTemplate: '%s | FitFoot',
  description:
    'Step into sustainability with premium Swiss footwear. Choose new eco-friendly shoes or expertly refurbished favorites. Every step makes a difference.',
  contactEmail: 'info@fitfoot.ch',
  supportEmail: 'support@fitfoot.ch',
  copyright: `© ${new Date().getFullYear()} FitFoot. All rights reserved.`,
} as const

export const HERO = {
  headline: 'Every step feels good.',
  headlineAccent: 'Inside and out.',
  sub: "Premium Swiss footwear that's kind to your feet and the planet. Choose from brand new eco-friendly designs or expertly refurbished favorites.",
  ctaPrimary: 'Find Your Perfect Fit',
  ctaSecondary: 'How It Works',
} as const

export const TRUST_BADGES = [
  'Free shipping over CHF 100',
  '30-day guarantee',
  'Carbon neutral delivery',
] as const

export const TWO_PATHS = {
  headline: 'Two paths, one mission',
  sub: 'Whether you choose new or refurbished, every pair helps create a more sustainable future',
  newPath: {
    title: 'Brand New & Eco-Friendly',
    body: 'Fresh designs crafted with sustainable materials. Recycled plastics, organic cotton, and responsibly sourced leather.',
    points: ['Latest sustainable materials', 'Carbon-neutral production', 'Full warranty included'],
    cta: 'Shop New Collection',
    href: '/shop?type=NEW',
  },
  refurbishedPath: {
    title: 'Expertly Refurbished',
    body: 'Premium shoes given new life by our craftspeople. Same quality, bigger impact, better price.',
    points: [
      'Up to 60% off original price',
      '95% less environmental impact',
      'Quality guarantee included',
    ],
    cta: 'Shop Refurbished',
    href: '/shop?type=REFURBISHED',
  },
} as const

export const IMPACT_STATS = [
  { value: '2,847', label: 'Pairs saved from waste' },
  { value: '34,164', label: 'kg CO₂ prevented' },
  { value: '127,892', label: 'Liters water saved' },
] as const

export const OUR_STORY = [
  'FitFoot was born from a simple belief: that everyone deserves footwear that combines exceptional quality with timeless design. Founded in the heart of Switzerland, we draw inspiration from the precision and craftsmanship that our country is known for.',
  'Our journey began when our founders, passionate about both design and quality, noticed a gap in the market for truly premium, ethically-made footwear. They set out to create products that would not only look beautiful but would also stand the test of time.',
  'Today, every FitFoot pair is designed in Switzerland and either crafted new from sustainable materials or expertly refurbished by our craftspeople — because the most sustainable shoe is the one that stays in use.',
] as const

export const VALUES = [
  {
    title: 'Quality First',
    body: 'We never compromise on materials or craftsmanship. Every product is made to last generations.',
  },
  {
    title: 'Premium Design',
    body: 'Our products embody precision, minimalism, and attention to detail.',
  },
  {
    title: 'Ethical Production',
    body: 'We work with trusted partners who share our commitment to fair labor practices.',
  },
  {
    title: 'Sustainability',
    body: 'We choose materials and processes that minimize our environmental impact.',
  },
] as const

export const TAKE_BACK = {
  headline: "Don't Throw Away. Trade In.",
  sub: "Your old shoes have value. We believe in circular fashion and zero waste. Send us your worn footwear and we'll give you a discount on your next purchase.",
  steps: [
    { title: 'Send Us Your Old Shoes', body: "Any brand, any condition. We'll cover shipping costs." },
    { title: 'We Assess & Process', body: 'Repair what can be saved, recycle what cannot.' },
    { title: 'You Get Your Discount', body: 'Receive 15-30% off your next FitFoot purchase.' },
    { title: 'Impact Multiplied', body: 'Your old shoes get new life or proper recycling.' },
  ],
} as const
