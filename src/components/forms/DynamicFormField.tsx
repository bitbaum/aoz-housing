'use client'

import type { FactorDef } from '@/lib/config/types'
import { TextField, EnumField, ScaleField, BooleanField, MultiField } from './DynamicFormFieldInputs'

export type FormFieldValue = string | number | boolean | string[] | Date | null | undefined

interface DynamicFormFieldProps {
  factor: FactorDef
  value?: FormFieldValue
  disabled?: boolean
}

export function DynamicFormField({ factor, value, disabled }: DynamicFormFieldProps) {
  switch (factor.type) {
    case 'text':
      return <TextField factor={factor} value={value as string | undefined} disabled={disabled} />
    case 'enum':
      return <EnumField factor={factor} value={value as string | undefined} disabled={disabled} />
    case 'scale':
      return <ScaleField factor={factor} value={value as number | undefined} disabled={disabled} />
    case 'boolean':
      return <BooleanField factor={factor} value={value as boolean | undefined} disabled={disabled} />
    case 'multi':
      return <MultiField factor={factor} value={value as string[] | undefined} disabled={disabled} />
    default:
      return null
  }
}
