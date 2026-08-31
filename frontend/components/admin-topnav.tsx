'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutAdmin } from '@/lib/admin-auth';
import { Menu, X, LogOut } from 'lucide-react';

export function AdminTopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logoutAdmin();
    router.push('/admin');
  };

  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="font-bold text-lg hover:text-slate-300">
              Admin Console
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/admin/dashboard" className="hover:text-slate-300 transition">
                Dashboard
              </Link>
              <Link href="/admin/orders" className="hover:text-slate-300 transition">
                Orders
              </Link>
              <Link href="/admin/rentals" className="hover:text-slate-300 transition">
                Rentals
              </Link>
              <Link href="/admin/products" className="hover:text-slate-300 transition">
                Products
              </Link>
              <Link href="/admin/settings" className="hover:text-slate-300 transition">
                Settings
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop logout button */}
          <div className="hidden md:block">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 py-4 px-2 space-y-2">
            <Link href="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-slate-700">
              Dashboard
            </Link>
            <Link href="/admin/orders" className="block px-3 py-2 rounded hover:bg-slate-700">
              Orders
            </Link>
            <Link href="/admin/rentals" className="block px-3 py-2 rounded hover:bg-slate-700">
              Rentals
            </Link>
            <Link href="/admin/products" className="block px-3 py-2 rounded hover:bg-slate-700">
              Products
            </Link>
            <Link href="/admin/settings" className="block px-3 py-2 rounded hover:bg-slate-700">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 mt-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
