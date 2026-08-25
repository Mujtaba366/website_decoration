import React, { useState } from 'react'
import { Button, Card, CardContent, CardHeader, DataTable, Badge } from '@components/ui'
import { PageHeader } from '@components/layout'
import { useCompany } from '@context/CompanyContext'
import { mockCompanyMembers } from '@data/mockData'
import { Plus } from 'lucide-react'
import type { CompanyMember } from '@types'

export function Team() {
  const { currentCompany } = useCompany()
  const [members] = useState<CompanyMember[]>(mockCompanyMembers)

  const roleVariant = {
    owner: 'danger',
    admin: 'warning',
    manager: 'info',
    user: 'default',
  } as const

  const statusVariant = {
    active: 'success',
    invited: 'warning',
    inactive: 'default',
  } as const

  const columns = [
    {
      key: 'user',
      label: 'Name',
      render: (v: unknown) => {
        const user = v as any
        return user ? `${user.first_name} ${user.last_name}` : 'N/A'
      },
    },
    { key: 'user', label: 'Email', render: (v: unknown) => (v as any)?.email || 'N/A' },
    {
      key: 'role',
      label: 'Role',
      render: (v: unknown) => (
        <Badge variant={roleVariant[v as keyof typeof roleVariant]}>
          {String(v)}
        </Badge>
      ),
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
        title="Team Members"
        description="Manage team members and permissions"
        action={
          <Button variant="primary">
            <Plus size={16} className="mr-2" />
            Invite Member
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Team</h2>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={members} />
        </CardContent>
      </Card>
    </div>
  )
}
