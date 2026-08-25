export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
  created_at: string
}

export interface Company {
  id: string
  owner_id: string
  display_name: string
  legal_name: string
  currency: string
  country?: string
  industry?: string
  tax_id?: string
  created_at: string
  updated_at: string
}

export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: 'owner' | 'admin' | 'manager' | 'user'
  status: 'active' | 'invited' | 'inactive'
  joined_at: string
  user?: User
}

export interface Role {
  id: string
  company_id: string
  name: string
  description: string
  permissions: Permission[]
  created_at: string
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface ChartOfAccount {
  id: string
  company_id: string
  account_number: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  subtype?: string
  balance: number
  is_active: boolean
  created_at: string
}

export interface TaxRate {
  id: string
  company_id: string
  name: string
  rate: number
  is_active: boolean
  created_at: string
}

export interface Item {
  id: string
  company_id: string
  name: string
  description?: string
  sku?: string
  unit_price: number
  tax_rate_id?: string
  is_active: boolean
  created_at: string
}

export interface Bill {
  id: string
  company_id: string
  bill_number: string
  vendor_id: string
  date: string
  due_date: string
  amount: number
  status: 'draft' | 'sent' | 'received' | 'approved' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  company_id: string
  po_number: string
  vendor_id: string
  date: string
  delivery_date: string
  amount: number
  status: 'draft' | 'sent' | 'received' | 'completed'
  items: PurchaseOrderItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  item_id: string
  quantity: number
  unit_price: number
  total: number
}

export interface JournalEntry {
  id: string
  company_id: string
  entry_number: string
  date: string
  description: string
  reference_type?: string
  reference_id?: string
  lines: JournalEntryLine[]
  status: 'draft' | 'posted'
  created_at: string
  updated_at: string
}

export interface JournalEntryLine {
  id: string
  journal_entry_id: string
  account_id: string
  debit?: number
  credit?: number
  description?: string
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
