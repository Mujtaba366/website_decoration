import React, { useState } from 'react'
import { Button, Card, CardContent, CardHeader, DataTable, Badge } from '../components/ui'
import { PageHeader } from '../components/layout'
import { useCompany } from '../context/CompanyContext'
import { mockBills } from '@data/mockData'
import { formatCurrency, formatDate } from '../lib/utils'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Bill } from '../types'

export function Bills() {
  const { currentCompany } = useCompany()
  const [bills] = useState<Bill[]>(mockBills)

  const statusVariant = {
    draft: 'warning',
    sent: 'info',
    received: 'success',
    approved: 'success',
    paid: 'success',
  } as const

  const columns = [
    { key: 'bill_number', label: 'Bill #', width: '100px' },
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
        title="Bills"
        description="Manage vendor bills and payments"
        action={
          <Button variant="primary">
            <Plus size={16} className="mr-2" />
            New Bill
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Bills</h2>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={bills} />
        </CardContent>
      </Card>
    </div>
  )
}
