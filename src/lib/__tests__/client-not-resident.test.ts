import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { BRAND } from '@/lib/config/brand'

/**
 * The person is a Klient*in. "Bewohner" is only for who lives in a flat.
 *
 * `BRAND.clientTerm` already says what this register calls the person, and the
 * staff UI mostly obeys it — the nav, the list and the intake form all read
 * "Klient*innen". What kept leaking through was prose written by hand, in
 * places nobody thought of as naming a role:
 *
 *   'Nachrichten von Bewohner*innen lesen und beantworten'   (a permission)
 *   'Admin-gepflegte Angebote für das Bewohnerportal.'        (a page subtitle)
 *   'Bewohner hat niedrige Zufriedenheit gemeldet'            (an incident body)
 *
 * The first of those was written by me on 2026-09-05, in the same session that
 * named the permission — which is the point: this is not legacy text somebody
 * forgot, it is a word that keeps being reached for.
 *
 * ## The rule, and why it is not "never say Bewohner"
 *
 * Sometimes the word is exactly right. "Aktuelle Bewohner" in a flat's profile
 * means the people who live there, and calling them Klient*innen would be
 * worse — it would describe a housing fact in casework vocabulary.
 *
 * So: **the word is allowed only where the line itself shows it is about
 * sharing a dwelling** — either the key names housing, or the sentence does.
 * That makes each exemption self-justifying rather than a claim somebody has
 * to take on trust. An allowlist of blessed strings ages badly and stops being
 * checked; this cannot be satisfied by a line about messages or permissions,
 * because nothing in such a line mentions living anywhere.
 */

const ROOT = join(__dirname, '..', '..', '..')

/** Where user-facing German prose lives. */
const PROSE_DIRS = ['src/lib/constants/labels', 'src/lib/config', 'src/lib/i18n/dictionaries']

/** Signals that a line is talking about a dwelling and its occupants. */
const ABOUT_A_DWELLING =
  /roommate|unit|housing|wohn|Wohnung|Unterkunft|Zimmer|zusamm|Haushalt|Mitbewohn|Platz/i

function proseFiles(): string[] {
  const out: string[] = []
  for (const dir of PROSE_DIRS) {
    const base = join(ROOT, dir)
    let entries: string[]
    try {
      entries = readdirSync(base)
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = join(base, entry)
      if (statSync(full).isDirectory()) continue
      if (!entry.endsWith('.ts')) continue
      if (entry.includes('.test.')) continue
      out.push(full)
    }
  }
  return out
}

describe('the person is a Klient*in, not a Bewohner', () => {
  it('has a brand term to use instead', () => {
    expect(BRAND.clientTerm).toBeTruthy()
    expect(BRAND.clientTermPlural).toBeTruthy()
  })

  it('says Bewohner only where the line is about living somewhere', () => {
    const offenders: string[] = []

    for (const file of proseFiles()) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, index) => {
        // Comments explain the rule and cite the bad strings; they are not UI.
        const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '')
        if (!/Bewohner/.test(code)) return
        // Remove the word itself before asking whether the REST of the line is
        // about a dwelling. Without this the gate is inert: "Bewohner" contains
        // "wohn", so every offending line matched the very pattern meant to
        // excuse only housing lines — a check satisfied by its own subject.
        // Caught by mutation; it passed green before this line existed.
        const context = code.replace(/Bewohner\w*/g, '')
        if (ABOUT_A_DWELLING.test(context)) return
        offenders.push(`${file.replace(ROOT + '/', '')}:${index + 1}  ${line.trim()}`)
      })
    }

    expect(
      offenders,
      `"Bewohner" names an occupant of a flat. These lines use it for the ` +
        `PERSON, where this register says "${BRAND.clientTerm}" — and nothing ` +
        `on the line is about living anywhere:\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})
