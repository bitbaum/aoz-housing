/**
 * The opportunity form.
 *
 * The "Voraussetzungen" block is the ethical core of the feature and is
 * grouped and captioned as such on purpose: everything in it describes the
 * PLACE. There is deliberately no field anywhere on this form that records
 * anything about a person’s status — see the note in src/lib/db/schema.ts.
 *
 * Every `name=` here is checked against the zod schema by
 * `opportunity-form-fields.test.ts`. A field the schema does not know is
 * stripped on save and vanishes with no error at all.
 */

import {
  OPPORTUNITY_KIND_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  PERMIT_REQUIREMENT_HINTS,
  PERMIT_REQUIREMENT_LABELS,
  type OpportunityRecord,
} from '@/lib/config/opportunities'
import { CEFR_LEVELS } from '@/lib/config/learning'
import { OPPORTUNITIES_ADMIN_LABELS as L } from '@/lib/constants'

type Props = {
  opportunity?: OpportunityRecord
}

function dateInputValue(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ''
}

function numberInputValue(value?: number | null) {
  return value === null || value === undefined ? '' : String(value)
}

export function OpportunityFormFields({ opportunity }: Props) {
  return (
    <div className="space-y-6">
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-label text-ui-muted">
          {L.sectionDetails}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-ui-text">{L.titleField}</span>
            <input
              name="title"
              defaultValue={opportunity?.title}
              placeholder={L.titlePlaceholder}
              required
              maxLength={160}
              className="input"
            />
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-ui-text">{L.descriptionField}</span>
            <textarea
              name="description"
              defaultValue={opportunity?.description}
              required
              maxLength={2000}
              rows={5}
              className="input min-h-32"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.organisation}</span>
            <input
              name="organisation"
              defaultValue={opportunity?.organisation}
              required
              maxLength={200}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.kindField}</span>
            <select
              name="kind"
              defaultValue={opportunity?.kind ?? 'VOLUNTEERING'}
              className="input"
            >
              {Object.entries(OPPORTUNITY_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.location}</span>
            <input
              name="location"
              defaultValue={opportunity?.location ?? ''}
              maxLength={300}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.schedule}</span>
            <input
              name="schedule"
              defaultValue={opportunity?.schedule ?? ''}
              placeholder="z.B. Di + Do, 11–14 Uhr"
              maxLength={300}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.hoursPerWeek}</span>
            <input
              name="hoursPerWeek"
              type="number"
              min={1}
              defaultValue={numberInputValue(opportunity?.hoursPerWeek)}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.seats}</span>
            <input
              name="seats"
              type="number"
              min={1}
              defaultValue={numberInputValue(opportunity?.seats)}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.startsAt}</span>
            <input
              name="startsAt"
              type="date"
              defaultValue={dateInputValue(opportunity?.startsAt)}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.endsAt}</span>
            <input
              name="endsAt"
              type="date"
              defaultValue={dateInputValue(opportunity?.endsAt)}
              className="input"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-ui-border bg-ui-subtle p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-label text-ui-muted">
            {L.sectionRequirements}
          </h2>
          <p className="mt-1 text-sm text-ui-muted">{L.requirementsHint}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.germanLevel}</span>
            <select
              name="germanLevel"
              defaultValue={opportunity?.germanLevel ?? ''}
              className="input"
            >
              <option value="">{L.germanLevelAny}</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.permitRequirement}</span>
            <select
              name="permitRequirement"
              defaultValue={opportunity?.permitRequirement ?? 'NONE'}
              className="input"
            >
              {Object.entries(PERMIT_REQUIREMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {/* The rule is enforced on the server for both publish paths. It is
                stated here too so a coach meets it while filling the form
                rather than as a rejection after pressing Veröffentlichen. */}
            <span className="block text-xs text-ui-muted">{L.permitRequirementWorkHint}</span>
          </label>

          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-ui-text">{L.requirementNote}</span>
            <input
              name="requirementNote"
              defaultValue={opportunity?.requirementNote ?? ''}
              maxLength={500}
              className="input"
            />
          </label>
        </div>

        <ul className="space-y-1 text-xs text-ui-muted">
          {Object.entries(PERMIT_REQUIREMENT_HINTS).map(([value, hint]) => (
            <li key={value}>
              <span className="font-medium text-ui-text">
                {PERMIT_REQUIREMENT_LABELS[value as keyof typeof PERMIT_REQUIREMENT_LABELS]}
              </span>{' '}
              — {hint}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-label text-ui-muted">
          {L.sectionContact}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.contactName}</span>
            <input
              name="contactName"
              defaultValue={opportunity?.contactName ?? ''}
              maxLength={200}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.contactEmail}</span>
            <input
              name="contactEmail"
              type="email"
              defaultValue={opportunity?.contactEmail ?? ''}
              maxLength={200}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.contactPhone}</span>
            <input
              name="contactPhone"
              defaultValue={opportunity?.contactPhone ?? ''}
              maxLength={80}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.website}</span>
            <input
              name="website"
              type="url"
              defaultValue={opportunity?.website ?? ''}
              maxLength={500}
              className="input"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-ui-text">{L.statusField}</span>
            <select name="status" defaultValue={opportunity?.status ?? 'DRAFT'} className="input">
              {Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  )
}
