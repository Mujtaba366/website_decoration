import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Product, CartItem } from '../types'
import { productApi, shopApi } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

export default function ShopDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [personalization, setPersonalization] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await productApi.list({ type: 'sale' })
        const data = 'data' in response ? (response.data as Product[]) : (response as Product[])
        const found = Array.isArray(data) ? data.find((p) => p.slug === slug) : null
        setProduct(found || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return

    const cartItem: CartItem = {
      product_id: product.id,
      product,
      quantity,
      personalization: personalization || undefined,
    }

    setCart([...cart, cartItem])
    setQuantity(1)
    setPersonalization('')
  }

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (cart.length === 0) {
      setError('Cart is empty')
      return
    }

    const formData = new FormData(e.currentTarget)
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.product.base_price * item.quantity,
      0
    )

    try {
      const orderData = {
        customer_name: formData.get('name'),
        customer_email: formData.get('email'),
        customer_phone: formData.get('phone') || undefined,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          personalization: item.personalization,
          price: item.product.base_price,
        })),
        total_amount: totalAmount,
        payment_method: formData.get('payment_method'),
        shipping_address: {
          street: formData.get('street') || '',
          city: formData.get('city') || '',
          postcode: formData.get('postcode') || '',
          country: 'New Zealand',
        },
      }

      const response = await shopApi.createOrder(orderData)
      const orderId = 'data' in response ? (response.data as any)?.id : (response as any)?.id

      if (orderId) {
        navigate(`/order-confirmation/${orderId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!product) return <div className="text-center py-12 text-red-600">Product not found</div>

  const cartTotal = cart.reduce((sum, item) => sum + item.product.base_price * item.quantity, 0)

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Product */}
        <div className="lg:col-span-2">
          {product.images && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full rounded-lg mb-4" />
          ) : (
            <div className="w-full aspect-square bg-slate-100 rounded-lg mb-4" />
          )}

          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-slate-600 mb-6">{product.description}</p>

          <Card className="p-6 mb-6">
            <div className="mb-4">
              <p className="text-slate-600 mb-2">Price</p>
              <p className="text-3xl font-bold">${product.base_price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personalization</label>
                <Input
                  placeholder="e.g., Your names, date, etc."
                  value={personalization}
                  onChange={(e) => setPersonalization(e.target.value)}
                />
              </div>

              <Button onClick={handleAddToCart} className="w-full">
                Add to Cart
              </Button>
            </div>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Cart ({cart.length})</h2>

            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm mb-6">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-6 border-b pb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.product.name}</span>
                        <span>${(item.product.base_price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-600">Qty: {item.quantity}</div>
                      {item.personalization && (
                        <div className="text-xs text-slate-600">"{item.personalization}"</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6 pb-6 border-b">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <Input name="name" placeholder="Name *" required />
                  <Input name="email" type="email" placeholder="Email *" required />
                  <Input name="phone" type="tel" placeholder="Phone" />
                  <Input name="street" placeholder="Street Address *" required />
                  <Input name="city" placeholder="City *" required />
                  <Input name="postcode" placeholder="Postcode *" required />

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <select name="payment_method" defaultValue="stripe" className="w-full px-3 py-2 border rounded-md">
                      <option value="stripe">Credit Card (Stripe)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="afterpay">Afterpay</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full">
                    Checkout
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
