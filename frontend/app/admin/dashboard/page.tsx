'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { getAdminSession, getAdminToken } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  total_products: number;
  total_revenue: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setUsername(session.username);
    }

    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentOrders((data.orders || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const body = await response.json().catch(() => ({}));
        setStatsError(body.error || 'Failed to load dashboard stats');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStatsError('Could not reach the server. Check your connection and try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome, <span className="font-semibold">{username}</span></p>
        </div>

        {statsError && (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700">{statsError}</div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '-' : stats?.total_orders || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Pending Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '-' : stats?.pending_orders || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Products</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{loading ? '-' : stats?.total_products || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10L4 11" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">${loading ? '-' : stats?.total_revenue || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {ordersLoading ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-slate-500">No orders yet. Check back soon!</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentOrders.map((order) => (
                <li key={order.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{order.customer_name}</p>
                    <p className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900">${Number(order.total).toFixed(2)}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
