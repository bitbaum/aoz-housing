import {
  CARE_ATTRIBUTE_CATALOG,
  CARE_ROLES,
  canWriteCareDomain,
  isCatalogKey,
  writableCareDomains,
} from '@/lib/config/care'

describe('care domains', () => {
  it('lets Leitung work every seat, and each specialist only their own', () => {
    expect(writableCareDomains('ADMIN')).toEqual([...CARE_ROLES])
    expect(writableCareDomains('BETREUUNG')).toEqual(['HOUSING'])
    expect(writableCareDomains('SOZIALARBEIT')).toEqual(['SOCIAL'])
    expect(writableCareDomains('JOBCOACH')).toEqual(['JOB'])
    expect(canWriteCareDomain('JOBCOACH', 'HOUSING')).toBe(false)
    expect(canWriteCareDomain('ADMIN', 'JOB')).toBe(true)
  })

  it('keeps catalog keys unique per domain, so a form field cannot collide', () => {
    for (const domain of CARE_ROLES) {
      const keys = CARE_ATTRIBUTE_CATALOG[domain].map((item) => item.key)
      expect(new Set(keys).size).toBe(keys.length)
      for (const key of keys) {
        expect(isCatalogKey(domain, key)).toBe(true)
      }
      expect(isCatalogKey(domain, 'diagnosis')).toBe(false)
    }
  })
})
