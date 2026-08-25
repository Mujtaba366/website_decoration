import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@components/ui'
import { PageHeader } from '@components/layout'
import { useCompany } from '@context/CompanyContext'
import { mockBills, mockJournalEntries } from '@data/mockData'
import { formatCurrency, formatDate } from '@lib/utils'
import { TrendingUp, DollarSign, CreditCard, BarChart3 } from 'lucide-react'

export function Home() {
  const { currentCompany } = useCompany()
  const [stats] = useState({
    totalRevenue: 150000,
    totalExpenses: 60000,
    cashBalance: 50000,
    accountsReceivable: 25000,
  })

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a company to continue</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's an overview of ${currentCompany.display_name}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp className="text-green-600" size={24} />}
          trend="+12.5%"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={<DollarSign className="text-red-600" size={24} />}
          trend="-5.2%"
        />
        <StatCard
          title="Cash Balance"
          value={formatCurrency(stats.cashBalance)}
          icon={<CreditCard className="text-blue-600" size={24} />}
          trend="+8.3%"
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(stats.accountsReceivable)}
          icon={<BarChart3 className="text-purple-600" size={24} />}
          trend="+3.1%"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Recent Bills</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{bill.bill_number}</p>
                    <p className="text-sm text-gray-500">{formatDate(bill.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(bill.amount)}</p>
                    <p className={`text-xs font-medium ${
                      bill.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {bill.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Recent Journal Entries</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockJournalEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{entry.entry_number}</p>
                    <p className="text-sm text-gray-500">{entry.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</p>
                    <p className={`text-xs font-medium ${
                      entry.status === 'posted' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {entry.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <Card className="flex flex-col items-start">
      <CardContent className="w-full pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            {icon}
          </div>
          {trend && <span className="text-xs font-medium text-green-600">{trend}</span>}
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  )
}
