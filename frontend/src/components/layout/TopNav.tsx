import React, { useState } from 'react'
import { Menu, LogOut, User } from 'lucide-react'
import { useCompany } from '@context/CompanyContext'
import { Dropdown, type DropdownItem } from '../ui'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { currentCompany, companies } = useCompany()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const companyItems: DropdownItem[] = companies.map((company) => ({
    label: company.display_name,
    value: company.id,
  }))

  const userMenuItems: DropdownItem[] = [
    { label: 'Profile', value: 'profile', icon: <User size={16} /> },
    { label: 'Logout', value: 'logout', icon: <LogOut size={16} /> },
  ]

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>

        {currentCompany && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {currentCompany.display_name}
              </p>
              <p className="text-xs text-gray-500">
                {currentCompany.currency}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold hover:bg-brand-700 transition-colors"
          title="User menu"
        >
          J
        </button>
      </div>
    </header>
  )
}
