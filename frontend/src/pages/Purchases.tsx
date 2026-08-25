import React, { useState } from 'react'
import { Button, Card, CardContent, CardHeader, DataTable, Badge } from '../components/ui'
import { PageHeader } from '../components/layout'
import { useCompany } from '../context/CompanyContext'
import { mockPurchaseOrders } from '@data/mockData'
import { formatCurrency, formatDate } from '../lib/utils'
import { Plus } from 'lucide-react'
import type { PurchaseOrder } from '../types'

export function Purchases() {
  const { currentCompany } = useCompany()
  const [orders] = useState<PurchaseOrder[]>(mockPurchaseOrders)

  const statusVariant = {
    draft: 'warning',
    sent: 'info',
    received: 'success',
    completed: 'success',
  } as const

  const columns = [
    { key: 'po_number', label: 'PO #', width: '100px' },
    { key: 'date', label: 'Date', render: (v: unknown) => formatDate(v as string) },
    { key: 'vendor_id', label: 'Vendor', render: () => 'Vendor Name' },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (v: unknown) => formatCurrency(v as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: unknown) => (
        <Badge variant={statusVariant[v as keyof typeof statusVariant]}>
          {String(v)}
        </Badge>
      ),
    },
  ]

  if (!currentCompany) {
    return <div className="text-center py-12"><p className="text-gray-600">Please select a company</p></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and vendor orders"
        action={
          <Button variant="primary">
            <Plus size={16} className="mr-2" />
            New PO
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Purchase Orders</h2>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={orders} />
        </CardContent>
      </Card>
    </div>
  )
}
