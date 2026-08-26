import { decodeDataUrl, ImageError } from '@/lib/images'

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('decodeDataUrl', () => {
  it('decodes a valid PNG data URL', () => {
    const { data, mimeType } = decodeDataUrl(TINY_PNG)
    expect(mimeType).toBe('image/png')
    expect(data.length).toBeGreaterThan(0)
  })

  it('rejects a non-data-url string', () => {
    expect(() => decodeDataUrl('https://example.com/shoe.jpg')).toThrow(ImageError)
  })

  it('rejects disallowed mime types', () => {
    expect(() => decodeDataUrl('data:image/gif;base64,AAAA')).toThrow(ImageError)
  })

  it('rejects an oversized payload', () => {
    const huge = 'A'.repeat(3 * 1024 * 1024)
    expect(() => decodeDataUrl(`data:image/png;base64,${huge}`)).toThrow(ImageError)
  })
})
