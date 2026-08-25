import React, { useState } from 'react'
import { Button, Card, CardContent, CardHeader, Input, Form, FormGroup, FormLabel } from '@components/ui'
import { PageHeader } from '@components/layout'
import { useCompany } from '@context/CompanyContext'

export function Settings() {
  const { currentCompany } = useCompany()
  const [isEditing, setIsEditing] = useState(false)

  if (!currentCompany) {
    return <div className="text-center py-12"><p className="text-gray-600">Please select a company</p></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage company settings and preferences"
      />

      <div className="max-w-2xl">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Company Information</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form>
              <FormGroup>
                <FormLabel>Display Name</FormLabel>
                <Input
                  defaultValue={currentCompany.display_name}
                  disabled={!isEditing}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Legal Name</FormLabel>
                <Input
                  defaultValue={currentCompany.legal_name}
                  disabled={!isEditing}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Currency</FormLabel>
                <Input
                  defaultValue={currentCompany.currency}
                  disabled={!isEditing}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Country</FormLabel>
                <Input
                  defaultValue={currentCompany.country || ''}
                  disabled={!isEditing}
                />
              </FormGroup>

              {isEditing && (
                <Button variant="primary" type="submit" className="mt-4">
                  Save Changes
                </Button>
              )}
            </Form>
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Preferences</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
