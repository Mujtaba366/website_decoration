export type ProductType = 'rental' | 'sale'
export type FulfillmentType = 'setup' | 'pickup'
export type BookingStatus = 'enquiry' | 'confirmed' | 'paid' | 'completed' | 'cancelled'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'stripe' | 'bank_transfer' | 'afterpay'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  type: ProductType
  category: string
  base_price: number
  images: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface RentalProduct extends Product {
  type: 'rental'
}

export interface ShopProduct extends Product {
  type: 'sale'
}

export interface RentalAvailability {
  id: string
  product_id: string
  date: string
  is_available: boolean
  booking_id?: string
}

export interface Booking {
  id: string
  product_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  event_date: string
  fulfillment_type: FulfillmentType
  address?: string
  is_within_auckland?: boolean
  extra_fee: number
  message?: string
  status: BookingStatus
  payment_method?: PaymentMethod
  payment_id?: string
  total_amount: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  quantity: number
  personalization?: string
  price: number
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: OrderItem[]
  total_amount: number
  payment_method?: PaymentMethod
  payment_id?: string
  status: OrderStatus
  shipping_address?: {
    street: string
    city: string
    postcode: string
    country: string
  }
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  related_to: string
  related_type: 'product' | 'booking' | 'order'
  sender_name: string
  sender_email: string
  content: string
  created_at: string
}

export interface Payment {
  id: string
  order_id?: string
  booking_id?: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  stripe_payment_id?: string
  stripe_client_secret?: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  product_id: string
  product: Product
  quantity: number
  personalization?: string
}

export interface RentalBookingFormData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  eventDate: string
  fulfillmentType: FulfillmentType
  address?: string
  message?: string
}

export interface ShopCheckoutData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress: {
    street: string
    city: string
    postcode: string
    country: string
  }
  paymentMethod: PaymentMethod
}

export interface AuthSession {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  details?: string
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}
