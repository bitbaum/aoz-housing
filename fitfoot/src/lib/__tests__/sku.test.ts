import { dedupeSku, generateSku } from '@/lib/sku'

describe('generateSku', () => {
  it('combines product prefix, size and color', () => {
    expect(generateSku('eco-trail-runner', '42', 'Forest Green')) .toBe('ECO-42-FOR')
  })

  it('omits the color segment when color is blank', () => {
    expect(generateSku('urban-sneaker', '40', '')).toBe('URB-40')
  })

  it('sanitizes non-alphanumeric size input', () => {
    expect(generateSku('geneva-formal', 'One Size', 'Black')).toBe('GEN-ONES-BLA')
  })

  it('falls back to OS for an empty size', () => {
    expect(generateSku('geneva-formal', '', 'Black')).toBe('GEN-OS-BLA')
  })
})

describe('dedupeSku', () => {
  it('returns the base when free', () => {
    expect(dedupeSku('ECO-42-FOR', new Set())).toBe('ECO-42-FOR')
  })

  it('appends -2 when taken', () => {
    expect(dedupeSku('ECO-42-FOR', new Set(['ECO-42-FOR']))).toBe('ECO-42-FOR-2')
  })
})
