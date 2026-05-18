/**
 * Chip select component for multi-select options (languages, dietary, etc.)
 */

interface ChipOption {
  value: string
  label: string
}

interface ChipSelectProps {
  name: string
  options: ChipOption[]
  selectedValues?: string[]
  defaultValues?: string[]
  onChange?: (values: string[]) => void
  multiple?: boolean
}

export function ChipSelect({
  name,
  options,
  selectedValues,
  defaultValues = [],
  onChange,
  multiple = true,
}: ChipSelectProps) {
  const isControlled = selectedValues !== undefined

  const handleChange = (value: string, checked: boolean) => {
    if (!onChange) return

    if (multiple) {
      const current = selectedValues || defaultValues
      if (checked) {
        onChange([...current, value])
      } else {
        onChange(current.filter((v) => v !== value))
      }
    } else {
      onChange(checked ? [value] : [])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = isControlled
          ? selectedValues?.includes(option.value)
          : undefined

        return (
          <label key={option.value} className="cursor-pointer">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={option.value}
              defaultChecked={
                !isControlled ? defaultValues.includes(option.value) : undefined
              }
              checked={isSelected}
              onChange={
                onChange
                  ? (e) => handleChange(option.value, e.target.checked)
                  : undefined
              }
              className="sr-only peer"
            />
            <div className="px-4 py-2.5 rounded-full border-2 border-ui-border peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-ui-on-accent transition-colors text-sm min-h-[44px] flex items-center">
              {option.label}
            </div>
          </label>
        )
      })}
    </div>
  )
}
