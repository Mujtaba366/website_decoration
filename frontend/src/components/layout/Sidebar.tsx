import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Settings,
  Home,
  TrendingUp,
  X,
} from 'lucide-react'
import { cn } from '@lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <Home size={20} /> },
  { label: 'Sales', href: '/sales', icon: <TrendingUp size={20} /> },
  { label: 'Purchases', href: '/purchases', icon: <ShoppingCart size={20} /> },
  { label: 'Accounting', href: '/accounting', icon: <BarChart3 size={20} /> },
  { label: 'Reporting', href: '/reporting', icon: <DollarSign size={20} /> },
  { label: 'Team', href: '/team', icon: <Users size={20} /> },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Business App</h1>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-800 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onClose()}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-800">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
