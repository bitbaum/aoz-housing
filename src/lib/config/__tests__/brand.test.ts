import { BRANDS, DEFAULT_BRAND_ID, type BrandId } from '../brand'

/**
 * The point of the brand layer is that re-badging is a config change, not a
 * code change. These tests hold that promise: every brand must be complete, and
 * the AOZ preset must stay byte-identical to what AOZ was originally shown —
 * "we can put it back" has to remain true.
 */
describe('brand presets', () => {
  const ids = Object.keys(BRANDS) as BrandId[]

  it('offers at least the original and the neutral brand', () => {
    expect(ids).toEqual(expect.arrayContaining(['aoz', 'aoch']))
  })

  it.each(['aoz', 'aoch'] as const)('%s fills in every field', (id) => {
    const brand = BRANDS[id]
    for (const [key, value] of Object.entries(brand)) {
      expect(`${key}=${value}`).not.toMatch(/=(undefined|null|)$/)
    }
  })

  it('keys each preset by its own id, so lookups cannot silently cross over', () => {
    for (const id of ids) expect(BRANDS[id].id).toBe(id)
  })

  it('preserves the original AOZ wording exactly', () => {
    // If this fails, handing the product to AOZ no longer restores what they saw.
    expect(BRANDS.aoz).toEqual({
      id: 'aoz',
      shortName: 'AOZ',
      codePrefix: 'AOZ-',
    })
  })

  it('gives each brand a distinct short name and code prefix', () => {
    const shortNames = ids.map((id) => BRANDS[id].shortName)
    const prefixes = ids.map((id) => BRANDS[id].codePrefix)
    expect(new Set(shortNames).size).toBe(ids.length)
    expect(new Set(prefixes).size).toBe(ids.length)
  })

  it('ends every code prefix with a separator so codes stay readable', () => {
    for (const id of ids) expect(BRANDS[id].codePrefix).toMatch(/-$/)
  })

  it('defaults to a brand that exists', () => {
    expect(BRANDS[DEFAULT_BRAND_ID]).toBeDefined()
  })
})

describe('brand resolution', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_BRAND

  afterEach(() => {
    process.env.NEXT_PUBLIC_BRAND = ORIGINAL
    jest.resetModules()
  })

  function loadBrand(value?: string) {
    jest.resetModules()
    if (value === undefined) delete process.env.NEXT_PUBLIC_BRAND
    else process.env.NEXT_PUBLIC_BRAND = value
    return require('../brand').BRAND
  }

  it('re-badges to AOZ from the environment alone', () => {
    expect(loadBrand('aoz').shortName).toBe('AOZ')
  })

  it('uses the neutral brand by default', () => {
    expect(loadBrand(undefined).id).toBe(DEFAULT_BRAND_ID)
  })

  it('falls back rather than crashing on an unknown brand', () => {
    // A typo in an env var must not take the whole app down.
    expect(loadBrand('not-a-brand').id).toBe(DEFAULT_BRAND_ID)
  })
})
