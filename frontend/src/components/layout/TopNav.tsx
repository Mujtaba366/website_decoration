import { Link } from 'react-router-dom'
import { Menu, ShoppingCart } from 'lucide-react'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="text-xl font-bold text-brand-600 no-underline">
          Aziza Events
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/rentals" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors no-underline">
            Rentals
          </Link>
          <Link to="/shop" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors no-underline">
            Shop
          </Link>
          <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
            How It Works
          </a>
          <a href="#about" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
            Contact
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Cart">
          <ShoppingCart size={20} />
        </button>
      </div>
    </header>
  )
}
