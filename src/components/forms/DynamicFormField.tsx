'use client'

import { useState } from 'react'
import type { FactorDef } from '@/lib/config/types'
import { factorDisplayValue } from '@/lib/config/factor-fields'
import { TextField, EnumField, ScaleField, BooleanField, MultiField } from './DynamicFormFieldInputs'

export type FormFieldValue = string | number | boolean | string[] | Date | null | undefined

interface DynamicFormFieldProps {
  factor: FactorDef
  /** The stored answer, or null/undefined while the question is unanswered. */
  value?: FormFieldValue
  /**
   * Lift the answer into a store the caller owns — required for AI assistance,
   * since the assistant and the user must write to the same place. Omit it and
   * the field keeps its own state, seeded from `value`, which is what the
   * plain forms (housing, dynamic sections) still want.
   */
  onChange?: (next: FormFieldValue) => void
  disabled?: boolean
  aiTouched?: boolean
}

export function DynamicFormField({ factor, value, onChange, disabled, aiTouched }: DynamicFormFieldProps) {
  // Only used when the caller does not lift state. Seeded once, like the
  // `defaultValue` this replaced.
  const [ownValue, setOwnValue] = useState<FormFieldValue>(value)
  const isControlled = onChange !== undefined

  const current = isControlled ? value : ownValue
  const handleChange = isControlled ? onChange : setOwnValue

  // Resolve the config default here so every input below receives a concrete
  // value to display, while the store keeps "unanswered" distinct from an
  // answer that happens to equal the default.
  const shown = factorDisplayValue(factor, current)
  const chrome = { disabled, aiTouched }

  switch (factor.type) {
    case 'text':
      return <TextField factor={factor} value={shown as string} onChange={handleChange} {...chrome} />
    case 'enum':
      return <EnumField factor={factor} value={shown as string} onChange={handleChange} {...chrome} />
    case 'scale':
      return <ScaleField factor={factor} value={shown as number} onChange={handleChange} {...chrome} />
    case 'boolean':
      return <BooleanField factor={factor} value={shown as boolean} onChange={handleChange} {...chrome} />
    case 'multi':
      return <MultiField factor={factor} value={shown as string[]} onChange={handleChange} {...chrome} />
    default:
      return null
  }
}
