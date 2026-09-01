'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { getAdminToken } from '@/lib/admin-auth';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Plus, X } from 'lucide-react';
import { toDateOnly, fromDateOnly } from '@/lib/date-utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Booking {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  contact: string;
  event_date: string;
  fulfillment_type: string;
  status: 'enquiry' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  message: string | null;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  booking_id: string | null;
}

interface DeliveryOption {
  id: string;
  label: string;
  description: string | null;
  fee: number;
  active: boolean;
  sort_order: number;
}

const STATUS_OPTIONS: Booking['status'][] = ['enquiry', 'confirmed', 'paid', 'completed', 'cancelled'];

export default function AdminRentals() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newOption, setNewOption] = useState({ label: '', description: '', fee: 0 });
  const [showAddOption, setShowAddOption] = useState(false);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);

  const authHeaders = () => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  /** Pulls the backend's own error message out of a failed response instead
   * of showing a generic "Failed to X" - the backend now says specifically
   * what went wrong (e.g. "That date is already blocked"). */
  const describeError = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body.error || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchAll = async () => {
    const headers = authHeaders();
    if (!headers) return;

    try {
      const [bookingsRes, blockedRes, optionsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/bookings`, { headers }),
        fetch(`${API_BASE}/blocked-dates`),
        fetch(`${API_BASE}/admin/delivery-options`, { headers }),
      ]);

      if (bookingsRes.ok) setBookings((await bookingsRes.json()).bookings || []);
      if (blockedRes.ok) setBlockedDates(await blockedRes.json());
      if (optionsRes.ok) setDeliveryOptions(await optionsRes.json());

      if (!bookingsRes.ok || !blockedRes.ok || !optionsRes.ok) {
        setError('Some rentals data failed to load. Try refreshing the page.');
      }
    } catch (err) {
      console.error('Failed to load rentals data:', err);
      setError('Could not reach the server. Check your connection and try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const blockedDateObjs = useMemo(
    () => blockedDates.map((b) => fromDateOnly(b.date)),
    [blockedDates]
  );

  const handleDayClick = async (day: Date) => {
    const headers = authHeaders();
    if (!headers) return;
    const dateStr = toDateOnly(day);
    setError('');
    setSuccess('');

    const existing = blockedDates.find((b) => b.date === dateStr);

    if (existing) {
      if (existing.booking_id) {
        setError(`${dateStr} is linked to a booking — remove it from the Blocked Dates list below if you want to unblock it anyway (this won't cancel the booking).`);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/blocked-dates/${existing.id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSuccess(`${dateStr} unblocked`);
        fetchAll();
      } else {
        setError(await describeError(res, 'Failed to unblock date'));
      }
    } else {
      const res = await fetch(`${API_BASE}/admin/blocked-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ date: dateStr, reason: 'Blocked by admin' }),
      });
      if (res.ok) {
        setSuccess(`${dateStr} blocked`);
        fetchAll();
      } else {
        setError(await describeError(res, 'Failed to block date'));
      }
    }
  };

  const handleUnblock = async (blocked: BlockedDate) => {
    const confirmMessage = blocked.booking_id
      ? `${blocked.date} is linked to a booking. Unblocking it will NOT cancel that booking - the date will just show as available again. Continue?`
      : `Unblock ${blocked.date}?`;
    if (!confirm(confirmMessage)) return;

    const headers = authHeaders();
    if (!headers) return;
    setError('');
    setSuccess('');

    const res = await fetch(`${API_BASE}/admin/blocked-dates/${blocked.id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) {
      setSuccess(`${blocked.date} unblocked`);
      fetchAll();
    } else {
      setError(await describeError(res, 'Failed to unblock date'));
    }
  };

  const handleStatusChange = async (bookingId: string, status: string) => {
    const headers = authHeaders();
    if (!headers) return;
    setError('');

    const res = await fetch(`${API_BASE}/admin/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchAll();
    } else {
      setError(await describeError(res, 'Failed to update booking status'));
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`Cancel the booking for ${booking.customer_name} on ${booking.event_date}? This keeps the record but frees up the date on the calendar.`)) return;
    const headers = authHeaders();
    if (!headers) return;
    setError('');
    setSuccess('');
    setBookingActionId(booking.id);

    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        setSuccess('Booking cancelled and date released');
        fetchAll();
      } else {
        setError(await describeError(res, 'Failed to cancel booking'));
      }
    } finally {
      setBookingActionId(null);
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!confirm(`Permanently delete the booking for ${booking.customer_name} on ${booking.event_date}? This cannot be undone and removes the record entirely - use Cancel instead if you want to keep it for history.`)) return;
    const headers = authHeaders();
    if (!headers) return;
    setError('');
    setSuccess('');
    setBookingActionId(booking.id);

    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${booking.id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setSuccess('Booking deleted');
        fetchAll();
      } else {
        setError(await describeError(res, 'Failed to delete booking'));
      }
    } finally {
      setBookingActionId(null);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = authHeaders();
    if (!headers || !newOption.label.trim()) return;
    setError('');

    const res = await fetch(`${API_BASE}/admin/delivery-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        label: newOption.label,
        description: newOption.description || null,
        fee: Number(newOption.fee) || 0,
        sort_order: deliveryOptions.length,
      }),
    });
    if (res.ok) {
      setSuccess('Delivery option added');
      setNewOption({ label: '', description: '', fee: 0 });
      setShowAddOption(false);
      fetchAll();
    } else {
      setError(await describeError(res, 'Failed to add delivery option'));
    }
  };

  const toggleOptionActive = async (option: DeliveryOption) => {
    const headers = authHeaders();
    if (!headers) return;
    setError('');

    const res = await fetch(`${API_BASE}/admin/delivery-options/${option.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ active: !option.active }),
    });
    if (res.ok) {
      fetchAll();
    } else {
      setError(await describeError(res, 'Failed to update delivery option'));
    }
  };

  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rentals</h1>
          <p className="text-slate-600 mt-2">
            One shared calendar across every rental item — blocking a date here blocks it for all products.
          </p>
        </div>

        {error && <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        {success && <div className="p-4 rounded bg-green-50 border border-green-200 text-green-700">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Global Availability Calendar</h2>
            <p className="text-sm text-slate-500 mb-4">
              Click any date to block or unblock it. Blocked dates apply to every rental product.
            </p>
            <Calendar
              mode="single"
              onDayClick={handleDayClick}
              modifiers={{ blocked: blockedDateObjs }}
              modifiersClassNames={{ blocked: 'bg-red-100 text-red-700 hover:bg-red-200 font-semibold' }}
              className="rounded-md border"
            />
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Blocked date
            </div>
          </div>

          {/* Blocked dates list */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Blocked Dates ({blockedDates.length})</h2>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <p className="px-6 py-8 text-center text-slate-500">Loading...</p>
              ) : blockedDates.length === 0 ? (
                <p className="px-6 py-8 text-center text-slate-500">No dates blocked. The calendar is wide open.</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {[...blockedDates].sort((a, b) => a.date.localeCompare(b.date)).map((b) => (
                    <li key={b.id} className="px-6 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{b.date}</p>
                        <p className="text-slate-500">{b.reason}{b.booking_id ? ' (linked to booking)' : ''}</p>
                      </div>
                      <button
                        onClick={() => handleUnblock(b)}
                        className="text-red-600 hover:text-red-800"
                        title="Unblock"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Bookings ({bookings.length})</h2>
          </div>
          {loading ? (
            <p className="px-6 py-8 text-center text-slate-500">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-500">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Event Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Fulfillment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className={`hover:bg-slate-50 ${b.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 text-sm text-slate-900">{b.product_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {b.customer_name}
                        <div className="text-xs text-slate-400">{b.contact}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{b.event_date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{b.fulfillment_type}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(b)}
                              disabled={bookingActionId === b.id}
                              className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
                              title="Cancel booking (keeps record, frees the date)"
                            >
                              <X size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(b)}
                            disabled={bookingActionId === b.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete booking permanently"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delivery options */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Delivery Options</h2>
            <button
              onClick={() => setShowAddOption(!showAddOption)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              {showAddOption ? <X size={16} /> : <Plus size={16} />}
              {showAddOption ? 'Cancel' : 'Add Option'}
            </button>
          </div>

          {showAddOption && (
            <form onSubmit={handleAddOption} className="px-6 py-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Label (e.g. Courier shipping)"
                value={newOption.label}
                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newOption.description}
                onChange={(e) => setNewOption({ ...newOption, description: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Extra fee"
                  value={newOption.fee}
                  onChange={(e) => setNewOption({ ...newOption, fee: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                  Save
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="px-6 py-8 text-center text-slate-500">Loading...</p>
          ) : deliveryOptions.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-500">
              No delivery options yet. Customers won&apos;t see any fulfillment choices on the booking form until you add one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {deliveryOptions.map((option) => (
                <li key={option.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${option.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {option.label} {option.fee > 0 && <span className="text-sm text-slate-500">(+${option.fee})</span>}
                    </p>
                    {option.description && <p className="text-sm text-slate-500">{option.description}</p>}
                  </div>
                  <button
                    onClick={() => toggleOptionActive(option)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      option.active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {option.active ? 'Remove' : 'Restore'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
