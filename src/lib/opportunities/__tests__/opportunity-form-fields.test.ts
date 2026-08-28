/**
 * Every field the form submits must be a field the schema accepts.
 *
 * Zod strips unknown keys silently. A `name=` with no matching schema key
 * therefore renders, accepts typing, submits, saves — and is gone, with no
 * error anywhere. This exact class has now bitten this repo three times, so it
 * is a gate rather than a habit.
 *
 * Read from the component SOURCE, not from a hand-listed array: a list would
 * have to be updated by the same person who forgot the schema key, which is
 * the failure it is supposed to catch.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { OpportunityFieldsSchema } from '@/lib/validation'

const COMPONENT = join(
  process.cwd(),
  'src',
  'components',
  'opportunities',
  'OpportunityFormFields.tsx'
)

function submittedFieldNames(): string[] {
  const source = readFileSync(COMPONENT, 'utf8')
  const names: string[] = []
  const pattern = /\bname="([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    if (!names.includes(match[1])) names.push(match[1])
  }
  return names
}

describe('OpportunityFormFields', () => {
  const fields = submittedFieldNames()

  it('submits fields at all — a silent empty match would pass everything below', () => {
    expect(fields.length).toBeGreaterThan(10)
  })

  it.each(submittedFieldNames())('«%s» is a key the schema keeps', (field) => {
    // `id` only exists on the update schema; every other field is on both.
    // The exported schemas are ZodEffects (they carry the work-permit rule),
    // which has no `.shape` — introspect the plain field object instead.
    const shape =
      field === 'id'
        ? { ...OpportunityFieldsSchema.shape, id: true }
        : OpportunityFieldsSchema.shape
    expect(Object.keys(shape)).toContain(field)
  })

  it('offers a control for every required field, so nothing is unfillable', () => {
    const required = Object.entries(OpportunityFieldsSchema.shape)
      .filter(([, schema]) => !schema.isOptional())
      .map(([key]) => key)

    for (const key of required) {
      expect(fields).toContain(key)
    }
  })

  it('records nothing about the person', () => {
    // The boundary this whole feature is built around. A field named for
    // permit, status or nationality would mean the eligibility rule had been
    // quietly inverted from "the place declares" to "the person declares".
    const source = readFileSync(COMPONENT, 'utf8')
    for (const forbidden of ['aufenthalt', 'bewilligungsstatus', 'nationalit', 'permitstatus']) {
      expect(source.toLowerCase()).not.toContain(forbidden)
    }
  })
})
