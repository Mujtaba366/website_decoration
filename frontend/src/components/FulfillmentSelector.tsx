import type { FulfillmentType } from '@types'
import { Card } from '@/components/ui'

interface FulfillmentSelectorProps {
  value: FulfillmentType | null
  onChange: (type: FulfillmentType) => void
  deliveryFee?: number
}

export function FulfillmentSelector({
  value,
  onChange,
  deliveryFee = 0,
}: FulfillmentSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Setup Option</label>

      <Card
        className={`p-4 cursor-pointer border-2 transition ${
          value === 'setup' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => onChange('setup')}
      >
        <h4 className="font-semibold mb-2">We'll Set It Up</h4>
        <p className="text-sm text-slate-600 mb-2">
          Our team delivers and sets up at your venue (within Auckland)
        </p>
        {deliveryFee > 0 && (
          <p className="text-sm text-blue-600 font-medium">
            +${deliveryFee.toFixed(2)} delivery fee
          </p>
        )}
      </Card>

      <Card
        className={`p-4 cursor-pointer border-2 transition ${
          value === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => onChange('pickup')}
      >
        <h4 className="font-semibold mb-2">I'll Pick It Up</h4>
        <p className="text-sm text-slate-600">
          You pick up and set up at your venue. Contact us for pickup location and time.
        </p>
      </Card>
    </div>
  )
}
