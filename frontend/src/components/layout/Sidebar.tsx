import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@lib/utils'

interface NavItem {
  label: string
  href: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'Shop', href: '/shop' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed md:hidden inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Aziza Events</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
