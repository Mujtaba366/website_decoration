const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

// Products
export const productsAPI = {
  list: () => apiCall('/products'),
  get: (id: string) => apiCall(`/products/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => apiCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/products/${id}`, { method: 'DELETE' }),
};

// Bookings
export const bookingsAPI = {
  list: () => apiCall('/bookings'),
  get: (id: string) => apiCall(`/bookings/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => apiCall(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/bookings/${id}`, { method: 'DELETE' }),
};

// Rental Availability
export const availabilityAPI = {
  list: () => apiCall('/availability'),
  get: (id: string) => apiCall(`/availability/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/availability', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => apiCall(`/availability/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/availability/${id}`, { method: 'DELETE' }),
};

// Orders
export const ordersAPI = {
  list: () => apiCall('/orders'),
  get: (id: string) => apiCall(`/orders/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => apiCall(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/orders/${id}`, { method: 'DELETE' }),
};

// Messages
export const messagesAPI = {
  list: () => apiCall('/messages'),
  get: (id: string) => apiCall(`/messages/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/messages/${id}`, { method: 'DELETE' }),
};

// Delivery options
export const deliveryOptionsAPI = {
  list: () => apiCall('/delivery-options'),
};

// Blocked dates (global rental calendar)
export const blockedDatesAPI = {
  list: () => apiCall('/blocked-dates'),
};

// Site settings
export const settingsAPI = {
  get: () => apiCall('/settings'),
};

// Payments
export const paymentsAPI = {
  list: () => apiCall('/payments'),
  get: (id: string) => apiCall(`/payments/${id}`),
  create: (data: Record<string, unknown>) => apiCall('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => apiCall(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Payment config - bank account + Stripe's non-secret config. Public, but
// deliberately narrow (see backend/api/payment_settings.py) - this is NOT
// the same table as site settings, which is fully open.
export const paymentConfigAPI = {
  get: () => apiCall('/payment-config'),
};

// Stripe checkout. Returns a 503 (surfaced as a thrown Error here, same as
// any other failed apiCall) if Stripe isn't configured on the backend.
export const checkoutAPI = {
  createStripeSession: (orderId: string) => apiCall<{ url: string }>('/checkout/stripe-session', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
  }),
};
