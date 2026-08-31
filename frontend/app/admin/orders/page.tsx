'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { getAdminToken } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  personalization?: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  contact: string;
  items: OrderItem[];
  total: number;
  payment_method: string;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  created_at: string;
}

const STATUS_OPTIONS: Order['status'][] = ['pending', 'paid', 'fulfilled', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const fetchOrders = async () => {
    const headers = authHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`${API_BASE}/admin/orders`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    const headers = authHeaders();
    if (!headers) return;

    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchOrders();
    } else {
      setError('Failed to update order status');
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Customer', 'Contact', 'Total', 'Payment Method', 'Status', 'Created At'],
      ...orders.map((o) => [o.id, o.customer_name, o.contact, o.total, o.payment_method, o.status, o.created_at]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-600 mt-2">Manage and track all customer orders</p>
        </div>

        {error && (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">All Orders ({orders.length})</h2>
              <button
                onClick={exportCsv}
                disabled={orders.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">No orders yet. Check back soon!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {order.customer_name}
                        <div className="text-xs text-slate-400">{order.contact}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {Array.isArray(order.items) ? order.items.map((i, idx) => (
                          <div key={idx}>{i.qty}x {i.name}</div>
                        )) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">${Number(order.total).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{order.payment_method}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
