import React from 'react'
import { Card, CardContent, CardHeader } from '../components/ui'
import { PageHeader } from '../components/layout'
import { useCompany } from '../context/CompanyContext'

export function Reporting() {
  const { currentCompany } = useCompany()

  if (!currentCompany) {
    return <div className="text-center py-12"><p className="text-gray-600">Please select a company</p></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View financial reports and analytics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Income Statement</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Balance Sheet</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Cash Flow</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Trial Balance</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
