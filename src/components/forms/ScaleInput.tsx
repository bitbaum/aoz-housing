/**
 * Scale input component for 1-5 rating scales
 */

interface ScaleInputProps {
  name: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  onChange?: (value: number) => void
}

export function ScaleInput({
  name,
  value,
  defaultValue,
  min = 1,
  max = 5,
  minLabel,
  maxLabel,
  onChange,
}: ScaleInputProps) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const currentValue = value ?? defaultValue

  return (
    <div>
      <div className="flex gap-2">
        {levels.map((level) => (
          <label key={level} className="flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={level}
              defaultChecked={defaultValue === level}
              checked={value !== undefined ? value === level : undefined}
              onChange={onChange ? () => onChange(level) : undefined}
              className="sr-only peer"
            />
            <div className="py-3 text-center rounded-lg border-2 border-gray-200 peer-checked:border-aoz-primary peer-checked:bg-aoz-primary peer-checked:text-white transition-colors font-medium min-h-[44px] flex items-center justify-center">
              {level}
            </div>
          </label>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
