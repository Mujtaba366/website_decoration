import { Input } from '@/components/ui'

interface DatePickerProps {
  label?: string
  value: string
  onChange: (date: string) => void
  minDate?: string
  disabled?: boolean
}

export function DatePicker({
  label = 'Select Date',
  value,
  onChange,
  minDate = new Date().toISOString().split('T')[0],
  disabled = false,
}: DatePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={minDate}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}
