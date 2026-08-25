import axios, { AxiosInstance, AxiosError } from 'axios'
import type { ApiResponse, PaginatedResponse } from '@types'

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

export const authApi = {
  getSession: () => apiClient.get('/auth/session'),
  logout: () => apiClient.post('/auth/logout', {}),
}

export const companyApi = {
  list: () => apiClient.get('/companies/'),
  create: (data: unknown) => apiClient.post('/companies/', data),
  get: (id: string) => apiClient.get(`/companies/${id}/`),
  update: (id: string, data: unknown) => apiClient.put(`/companies/${id}/`, data),
  getMembers: (id: string) => apiClient.get(`/companies/${id}/members/`),
  addMember: (id: string, data: unknown) => apiClient.post(`/companies/${id}/members/`, data),
}

export const billApi = {
  list: (companyId: string, params = {}) =>
    apiClient.get(`/companies/${companyId}/bills/`, { params }),
  create: (companyId: string, data: unknown) =>
    apiClient.post(`/companies/${companyId}/bills/`, data),
  get: (companyId: string, id: string) =>
    apiClient.get(`/companies/${companyId}/bills/${id}/`),
  update: (companyId: string, id: string, data: unknown) =>
    apiClient.put(`/companies/${companyId}/bills/${id}/`, data),
  delete: (companyId: string, id: string) =>
    apiClient.delete(`/companies/${companyId}/bills/${id}/`),
}

export const chartOfAccountApi = {
  list: (companyId: string) =>
    apiClient.get(`/companies/${companyId}/chart-of-accounts/`),
  create: (companyId: string, data: unknown) =>
    apiClient.post(`/companies/${companyId}/chart-of-accounts/`, data),
  update: (companyId: string, id: string, data: unknown) =>
    apiClient.put(`/companies/${companyId}/chart-of-accounts/${id}/`, data),
}

export const journalEntryApi = {
  list: (companyId: string, params = {}) =>
    apiClient.get(`/companies/${companyId}/journal-entries/`, { params }),
  create: (companyId: string, data: unknown) =>
    apiClient.post(`/companies/${companyId}/journal-entries/`, data),
  get: (companyId: string, id: string) =>
    apiClient.get(`/companies/${companyId}/journal-entries/${id}/`),
  post: (companyId: string, id: string) =>
    apiClient.post(`/companies/${companyId}/journal-entries/${id}/post/`, {}),
}

export const itemApi = {
  list: (companyId: string) =>
    apiClient.get(`/companies/${companyId}/items/`),
  create: (companyId: string, data: unknown) =>
    apiClient.post(`/companies/${companyId}/items/`, data),
  update: (companyId: string, id: string, data: unknown) =>
    apiClient.put(`/companies/${companyId}/items/${id}/`, data),
}

export const taxRateApi = {
  list: (companyId: string) =>
    apiClient.get(`/companies/${companyId}/tax-rates/`),
  create: (companyId: string, data: unknown) =>
    apiClient.post(`/companies/${companyId}/tax-rates/`, data),
  update: (companyId: string, id: string, data: unknown) =>
    apiClient.put(`/companies/${companyId}/tax-rates/${id}/`, data),
}
