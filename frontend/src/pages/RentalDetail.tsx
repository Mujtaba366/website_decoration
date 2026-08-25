import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Product, FulfillmentType } from '../types'
import { productApi, rentalApi, messageApi } from '../lib/api'
import { Button, Card, Input } from '../components/ui'
import { DatePicker, FulfillmentSelector } from '../components'

export default function RentalDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | null>(null)
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        // Fetch by slug from our mock data or API
        const response = await productApi.list({ type: 'rental' })
        const data = 'data' in response ? (response.data as Product[]) : (response as Product[])
        const found = Array.isArray(data) ? data.find((p) => p.slug === slug) : null
        if (found) {
          setProduct(found)
        } else {
          setError('Product not found')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product || !customerName || !customerEmail || !eventDate || !fulfillmentType) {
      setError('Please fill in all required fields')
      return
    }

    if (fulfillmentType === 'setup' && !address) {
      setError('Please provide an address for setup')
      return
    }

    try {
      setSubmitting(true)
      const bookingData = {
        product_id: product.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || undefined,
        event_date: eventDate,
        fulfillment_type: fulfillmentType,
        address: fulfillmentType === 'setup' ? address : undefined,
        message: message || undefined,
      }

      const response = await rentalApi.createBooking(bookingData)
      const bookingId = 'data' in response ? (response.data as any)?.id : (response as any)?.id

      if (bookingId) {
        // Redirect to confirmation
        navigate(`/booking-confirmation/${bookingId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!product) return <div className="text-center py-12 text-red-600">Product not found</div>

  const deliveryFee =
    fulfillmentType === 'setup' && address
      ? address.toLowerCase().includes('auckland')
        ? 0
        : 50
      : 0
  const totalPrice = product.base_price + deliveryFee

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full rounded-lg mb-4"
            />
          ) : (
            <div className="w-full aspect-square bg-slate-100 rounded-lg mb-4" />
          )}
          <div className="grid grid-cols-3 gap-2">
            {product.images?.slice(1).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name} ${idx + 2}`}
                className="w-full aspect-square object-cover rounded"
              />
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-slate-600 mb-4">{product.description}</p>

          <Card className="p-6 mb-6">
            <div className="mb-6">
              <p className="text-slate-600 mb-2">Price per rental</p>
              <p className="text-4xl font-bold">${product.base_price.toFixed(2)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-4">Your Information</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Event Date */}
              <DatePicker
                label="Event Date *"
                value={eventDate}
                onChange={setEventDate}
              />

              {/* Fulfillment Type */}
              <FulfillmentSelector
                value={fulfillmentType}
                onChange={setFulfillmentType}
                deliveryFee={deliveryFee}
              />

              {/* Address (for setup) */}
              {fulfillmentType === 'setup' && (
                <div>
                  <Input
                    placeholder="Venue Address *"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  {deliveryFee > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      Additional delivery fee outside Auckland: ${deliveryFee.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  placeholder="Any special requests or questions?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span>Rental price</span>
                  <span>${product.base_price.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between mb-4">
                    <span>Delivery fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !fulfillmentType}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Reserve Now'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
