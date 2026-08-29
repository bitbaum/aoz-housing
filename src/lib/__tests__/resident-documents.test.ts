import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  isAllowedDocumentType,
  isDocumentCategory,
  safeDownloadName,
} from '@/lib/config/documents'
import { ROLE_PERMISSIONS, STAFF_ROLES, hasPermission } from '@/lib/auth/role-policy'

/**
 * Career documents: who may read them, and what may be stored.
 *
 * Both halves are quiet failures. A role that should not see a CV seeing one
 * looks exactly like a role that should; an executable file accepted into a
 * document store looks exactly like a document, right up until a caseworker
 * opens it while signed in.
 */

describe('who may read a resident’s career documents', () => {
  it('gives the integration roles and Leitung read access', () => {
    for (const role of ['ADMIN', 'SOZIALARBEIT', 'JOBCOACH', 'FREIWILLIGENARBEIT'] as const) {
      expect(hasPermission({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:read')).toBe(true)
    }
  })

  it('does NOT give housing operations access to a CV', () => {
    // Betreuung runs the building: keys, quiet hours, who is in which room.
    // Someone's employment history is not a housing fact, and the rule
    // everywhere else in this product is the minimum the work requires.
    expect(hasPermission({ role: 'BETREUUNG', scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:read')).toBe(false)
    expect(hasPermission({ role: 'BETREUUNG', scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:write')).toBe(false)
  })

  it('lets the roles who build the file write, and the one who only consults it read', () => {
    for (const role of ['ADMIN', 'SOZIALARBEIT', 'JOBCOACH'] as const) {
      expect(hasPermission({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:write')).toBe(true)
    }
    // A volunteering coordinator may need to see a reference before placing
    // someone; the CV is the job coach's working document, not theirs to edit.
    expect(hasPermission({ role: 'FREIWILLIGENARBEIT', scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:read')).toBe(true)
    expect(hasPermission({ role: 'FREIWILLIGENARBEIT', scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:write')).toBe(false)
  })

  it('never grants write without read, which would be a role that cannot check its own work', () => {
    for (const role of STAFF_ROLES) {
      if (hasPermission({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:write')) {
        expect(hasPermission({ role, scope: 'OWN_DOMAIN', isSystemAdmin: false }, 'documents:read')).toBe(true)
      }
    }
  })

  it('keeps the permissions out of the shared OPERATIONAL block', () => {
    // BETREUUNG is `[...OPERATIONAL]`, so anything added to that block reaches
    // it silently. This asserts the separation rather than trusting it.
    const betreuung = ROLE_PERMISSIONS.BETREUUNG as readonly string[]
    expect(betreuung).not.toContain('documents:read')
    expect(betreuung).not.toContain('documents:write')
  })
})

describe('what may be stored', () => {
  it('accepts the formats a CV is actually written in', () => {
    for (const mime of Object.keys(DOCUMENT_MIME_TYPES)) {
      expect(isAllowedDocumentType(mime)).toBe(true)
    }
  })

  it.each([
    'image/svg+xml',
    'text/html',
    'application/xhtml+xml',
    'application/javascript',
    'text/xml',
    'application/x-msdownload',
  ])('refuses %s — a document store must not accept anything executable', (mime) => {
    expect(isAllowedDocumentType(mime)).toBe(false)
  })

  it('refuses an empty or unknown type rather than defaulting to allowed', () => {
    expect(isAllowedDocumentType('')).toBe(false)
    expect(isAllowedDocumentType('application/octet-stream')).toBe(false)
  })

  it('is not fooled by inherited object properties', () => {
    // A plain `mime in DOCUMENT_MIME_TYPES` would answer true for these,
    // because every object inherits them.
    expect(isAllowedDocumentType('constructor')).toBe(false)
    expect(isAllowedDocumentType('toString')).toBe(false)
    expect(isAllowedDocumentType('__proto__')).toBe(false)
  })

  it('caps uploads at a size a scanned CV clears and a video does not', () => {
    expect(DOCUMENT_MAX_BYTES).toBe(5 * 1024 * 1024)
  })
})

describe('categories are vocabulary', () => {
  it('labels every category, so none can render blank', () => {
    for (const category of DOCUMENT_CATEGORIES) {
      expect(DOCUMENT_CATEGORY_LABELS[category]).toBeTruthy()
    }
  })

  it('rejects anything not in the list', () => {
    expect(isDocumentCategory('CV')).toBe(true)
    expect(isDocumentCategory('MEDICAL')).toBe(false)
    expect(isDocumentCategory('')).toBe(false)
  })
})

describe('download filenames cannot break the header', () => {
  it('strips quotes, newlines and path separators', () => {
    const hostile = 'a"b\r\nContent-Length: 0\r\n\r\n<script>/../etc/passwd'
    const safe = safeDownloadName(hostile)

    expect(safe).not.toContain('"')
    expect(safe).not.toContain('\r')
    expect(safe).not.toContain('\n')
    expect(safe).not.toContain('/')
  })

  it('keeps ordinary punctuation and non-ASCII names intact', () => {
    // An earlier version of this used a mistyped character range that ate
    // ordinary punctuation, so this pins what must SURVIVE, not only what must
    // not.
    expect(safeDownloadName('Lebenslauf (2026) - Müller.pdf')).toBe(
      'Lebenslauf (2026) - Müller.pdf'
    )
    expect(safeDownloadName('Сертификат.pdf')).toBe('Сертификат.pdf')
  })

  it('never returns an empty name', () => {
    expect(safeDownloadName('')).toBe('dokument')
    expect(safeDownloadName('///')).toBeTruthy()
  })
})
