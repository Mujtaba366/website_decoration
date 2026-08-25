import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse, PaginatedResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()

export const productApi = {
  list: (filters?: { type?: string; category?: string }) =>
    apiClient.get('/products/', { params: filters }),
  get: (id: string) => apiClient.get(`/products/${id}/`),
}

export const rentalApi = {
  getAvailability: (productId: string, startDate?: string, endDate?: string) =>
    apiClient.get(`/products/${productId}/availability/`, {
      params: { start_date: startDate, end_date: endDate },
    }),
  createBooking: (data: unknown) => apiClient.post('/bookings/', data),
  getBooking: (id: string) => apiClient.get(`/bookings/${id}/`),
}

export const shopApi = {
  createOrder: (data: unknown) => apiClient.post('/orders/', data),
  getOrder: (id: string) => apiClient.get(`/orders/${id}/`),
}

export const messageApi = {
  create: (data: unknown) => apiClient.post('/messages/', data),
  list: (relatedId: string) => apiClient.get(`/messages/${relatedId}/`),
}

export const paymentApi = {
  create: (data: unknown) => apiClient.post('/payments/', data),
  get: (id: string) => apiClient.get(`/payments/${id}/`),
}
