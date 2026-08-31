'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';

export default function AdminOrders() {
  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-600 mt-2">Manage and track all customer orders</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">All Orders</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Export
              </button>
            </div>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500">No orders yet. Check back soon!</p>
          </div>
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
