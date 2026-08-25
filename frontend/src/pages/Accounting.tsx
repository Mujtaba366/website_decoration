import React, { useState } from 'react'
import { Button, Card, CardContent, CardHeader, DataTable } from '@components/ui'
import { PageHeader } from '@components/layout'
import { useCompany } from '@context/CompanyContext'
import { mockChartOfAccounts } from '@data/mockData'
import { formatCurrency } from '@lib/utils'
import { Plus } from 'lucide-react'
import type { ChartOfAccount } from '@types'

export function Accounting() {
  const { currentCompany } = useCompany()
  const [accounts] = useState<ChartOfAccount[]>(mockChartOfAccounts)

  const columns = [
    { key: 'account_number', label: 'Account #', width: '100px' },
    { key: 'name', label: 'Account Name' },
    { key: 'type', label: 'Type', render: (v: unknown) => String(v).toUpperCase() },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right' as const,
      render: (v: unknown) => formatCurrency(v as number),
    },
  ]

  if (!currentCompany) {
    return <div className="text-center py-12"><p className="text-gray-600">Please select a company</p></div>
  }

  const totalAssets = accounts
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + a.balance, 0)

  const totalLiabilities = Math.abs(
    accounts
      .filter(a => a.type === 'liability')
      .reduce((sum, a) => sum + a.balance, 0)
  )

  const totalEquity = accounts
    .filter(a => a.type === 'equity')
    .reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your general ledger accounts"
        action={
          <Button variant="primary">
            <Plus size={16} className="mr-2" />
            New Account
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Assets" value={formatCurrency(totalAssets)} />
        <SummaryCard title="Total Liabilities" value={formatCurrency(totalLiabilities)} />
        <SummaryCard title="Total Equity" value={formatCurrency(totalEquity)} />
      </div>

      {/* Chart of Accounts Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Accounts</h2>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={accounts} />
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600 mb-2">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  )
}
