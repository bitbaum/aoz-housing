import { dedupeSlug, slugify } from '@/lib/slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Eco Trail Runner')).toBe('eco-trail-runner')
  })

  it('strips accents', () => {
    expect(slugify('Genève Formal')).toBe('geneve-formal')
  })

  it('collapses repeated separators', () => {
    expect(slugify('Alpine  Trek --- Pro!!')).toBe('alpine-trek-pro')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -Urban Sneaker- ')).toBe('urban-sneaker')
  })

  it('handles empty input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('!!!')).toBe('')
  })
})

describe('dedupeSlug', () => {
  it('returns the base when free', () => {
    expect(dedupeSlug('urban-sneaker', new Set())).toBe('urban-sneaker')
  })

  it('appends -2 when the base is taken', () => {
    expect(dedupeSlug('urban-sneaker', new Set(['urban-sneaker']))).toBe('urban-sneaker-2')
  })

  it('finds the first free suffix', () => {
    const taken = new Set(['urban-sneaker', 'urban-sneaker-2', 'urban-sneaker-3'])
    expect(dedupeSlug('urban-sneaker', taken)).toBe('urban-sneaker-4')
  })

  it('falls back to "product" for an empty base', () => {
    expect(dedupeSlug('', new Set())).toBe('product')
  })
})
