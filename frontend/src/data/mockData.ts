import type {
  User,
  Company,
  CompanyMember,
  Bill,
  ChartOfAccount,
  TaxRate,
  Item,
  JournalEntry,
  PurchaseOrder,
} from '../types'

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockCompanies: Company[] = [
  {
    id: '1',
    owner_id: '1',
    display_name: 'Acme Corporation',
    legal_name: 'Acme Corp Inc.',
    currency: 'USD',
    country: 'United States',
    industry: 'Manufacturing',
    tax_id: '12-3456789',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    owner_id: '1',
    display_name: 'Tech Startup',
    legal_name: 'Tech Startup LLC',
    currency: 'USD',
    country: 'United States',
    industry: 'Software',
    tax_id: '98-7654321',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
]

export const mockCompanyMembers: CompanyMember[] = [
  {
    id: '1',
    company_id: '1',
    user_id: '1',
    role: 'owner',
    status: 'active',
    joined_at: '2024-01-01T00:00:00Z',
    user: mockUser,
  },
]

export const mockChartOfAccounts: ChartOfAccount[] = [
  {
    id: '1',
    company_id: '1',
    account_number: '1000',
    name: 'Cash',
    type: 'asset',
    subtype: 'current',
    balance: 50000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    account_number: '1200',
    name: 'Accounts Receivable',
    type: 'asset',
    subtype: 'current',
    balance: 25000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    company_id: '1',
    account_number: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    subtype: 'current',
    balance: -15000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    company_id: '1',
    account_number: '3000',
    name: 'Common Stock',
    type: 'equity',
    balance: 100000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    company_id: '1',
    account_number: '4000',
    name: 'Sales Revenue',
    type: 'revenue',
    balance: 150000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    company_id: '1',
    account_number: '5000',
    name: 'Cost of Goods Sold',
    type: 'expense',
    balance: -60000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockTaxRates: TaxRate[] = [
  {
    id: '1',
    company_id: '1',
    name: 'Standard Rate',
    rate: 0.1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    name: 'Reduced Rate',
    rate: 0.05,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockItems: Item[] = [
  {
    id: '1',
    company_id: '1',
    name: 'Product A',
    description: 'High quality product',
    sku: 'PROD-A-001',
    unit_price: 100,
    tax_rate_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    name: 'Product B',
    description: 'Budget product',
    sku: 'PROD-B-001',
    unit_price: 50,
    tax_rate_id: '2',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockBills: Bill[] = [
  {
    id: '1',
    company_id: '1',
    bill_number: 'BILL-001',
    vendor_id: 'vendor-1',
    date: '2024-01-15T00:00:00Z',
    due_date: '2024-02-15T00:00:00Z',
    amount: 5000,
    status: 'received',
    notes: 'Office supplies',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    bill_number: 'BILL-002',
    vendor_id: 'vendor-2',
    date: '2024-02-01T00:00:00Z',
    due_date: '2024-03-01T00:00:00Z',
    amount: 3000,
    status: 'draft',
    notes: 'Equipment rental',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
]

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    company_id: '1',
    po_number: 'PO-001',
    vendor_id: 'vendor-1',
    date: '2024-02-10T00:00:00Z',
    delivery_date: '2024-02-20T00:00:00Z',
    amount: 10000,
    status: 'sent',
    items: [
      {
        id: '1',
        purchase_order_id: '1',
        item_id: '1',
        quantity: 50,
        unit_price: 100,
        total: 5000,
      },
      {
        id: '2',
        purchase_order_id: '1',
        item_id: '2',
        quantity: 100,
        unit_price: 50,
        total: 5000,
      },
    ],
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
  },
]

export const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    company_id: '1',
    entry_number: 'JE-001',
    date: '2024-01-15T00:00:00Z',
    description: 'Monthly revenue entry',
    status: 'posted',
    lines: [
      {
        id: '1',
        journal_entry_id: '1',
        account_id: '1',
        debit: 10000,
        credit: undefined,
        description: 'Cash received',
      },
      {
        id: '2',
        journal_entry_id: '1',
        account_id: '5',
        debit: undefined,
        credit: 10000,
        description: 'Sales revenue',
      },
    ],
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
]
