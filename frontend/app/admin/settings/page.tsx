'use client';

import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { getAdminToken } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SiteSettingsForm {
  site_name: string;
  tagline: string;
  support_email: string;
  phone: string;
  location: string;
  instagram_handle: string;
  service_area_note: string;
  business_hours: string;
  footer_note: string;
  hero_eyebrow: string;
  hero_heading: string;
  hero_subheading: string;
  cta_heading: string;
  cta_subheading: string;
  about_heading: string;
  about_subheading: string;
  about_story: string;
  how_it_works_heading: string;
  how_it_works_subheading: string;
  contact_heading: string;
  contact_subheading: string;
  contact_intro_heading: string;
  contact_intro_text: string;
  rentals_eyebrow: string;
  rentals_heading: string;
  rentals_subheading: string;
  shop_eyebrow: string;
  shop_heading: string;
  shop_subheading: string;
}

const emptySettings: SiteSettingsForm = {
  site_name: '',
  tagline: '',
  support_email: '',
  phone: '',
  location: '',
  instagram_handle: '',
  service_area_note: '',
  business_hours: '',
  footer_note: '',
  hero_eyebrow: '',
  hero_heading: '',
  hero_subheading: '',
  cta_heading: '',
  cta_subheading: '',
  about_heading: '',
  about_subheading: '',
  about_story: '',
  how_it_works_heading: '',
  how_it_works_subheading: '',
  contact_heading: '',
  contact_subheading: '',
  contact_intro_heading: '',
  contact_intro_text: '',
  rentals_eyebrow: '',
  rentals_heading: '',
  rentals_subheading: '',
  shop_eyebrow: '',
  shop_heading: '',
  shop_subheading: '',
};

interface PaymentSettingsForm {
  bank_account_number: string;
  bank_account_name: string;
  bank_transfer_enabled: boolean;
  stripe_enabled: boolean;
  stripe_publishable_key: string;
  stripe_success_url: string;
  stripe_cancel_url: string;
  currency: string;
}

const emptyPaymentSettings: PaymentSettingsForm = {
  bank_account_number: '',
  bank_account_name: '',
  bank_transfer_enabled: true,
  stripe_enabled: false,
  stripe_publishable_key: '',
  stripe_success_url: '',
  stripe_cancel_url: '',
  currency: 'NZD',
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettingsForm>(emptySettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsForm>(emptyPaymentSettings);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  /** Pulls the backend's own error message out of a failed response instead
   * of always showing a generic "Failed to X" string. */
  const describeError = async (res: Response, fallback: string) => {
    try {
      const body = await res.json();
      return body.error || fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings({
            site_name: data.site_name || '',
            tagline: data.tagline || '',
            support_email: data.support_email || '',
            phone: data.phone || '',
            location: data.location || '',
            instagram_handle: data.instagram_handle || '',
            service_area_note: data.service_area_note || '',
            business_hours: data.business_hours || '',
            footer_note: data.footer_note || '',
            hero_eyebrow: data.hero_eyebrow || '',
            hero_heading: data.hero_heading || '',
            hero_subheading: data.hero_subheading || '',
            cta_heading: data.cta_heading || '',
            cta_subheading: data.cta_subheading || '',
            about_heading: data.about_heading || '',
            about_subheading: data.about_subheading || '',
            about_story: data.about_story || '',
            how_it_works_heading: data.how_it_works_heading || '',
            how_it_works_subheading: data.how_it_works_subheading || '',
            contact_heading: data.contact_heading || '',
            contact_subheading: data.contact_subheading || '',
            contact_intro_heading: data.contact_intro_heading || '',
            contact_intro_text: data.contact_intro_text || '',
            rentals_eyebrow: data.rentals_eyebrow || '',
            rentals_heading: data.rentals_heading || '',
            rentals_subheading: data.rentals_subheading || '',
            shop_eyebrow: data.shop_eyebrow || '',
            shop_heading: data.shop_heading || '',
            shop_subheading: data.shop_subheading || '',
          });
        } else {
          setSettingsError(await describeError(res, 'Failed to load settings'));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setSettingsError('Could not reach the server. Check your connection and try refreshing.');
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  const handleSaveSettings = async () => {
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsSaving(true);

    try {
      const token = getAdminToken();
      if (!token) {
        setSettingsError('Not authenticated - try logging in again.');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        setSettingsError(await describeError(response, 'Failed to save settings'));
        return;
      }

      setSettingsSuccess('Settings saved successfully!');
    } catch (err) {
      setSettingsError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = getAdminToken();
        if (!token) return;
        const res = await fetch(`${API_BASE}/admin/payment-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPaymentSettings({
            bank_account_number: data.bank_account_number || '',
            bank_account_name: data.bank_account_name || '',
            bank_transfer_enabled: data.bank_transfer_enabled ?? true,
            stripe_enabled: data.stripe_enabled ?? false,
            stripe_publishable_key: data.stripe_publishable_key || '',
            stripe_success_url: data.stripe_success_url || '',
            stripe_cancel_url: data.stripe_cancel_url || '',
            currency: data.currency || 'NZD',
          });
        } else {
          setPaymentError(await describeError(res, 'Failed to load payment settings'));
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err);
        setPaymentError('Could not reach the server. Check your connection and try refreshing.');
      } finally {
        setPaymentLoading(false);
      }
    })();
  }, []);

  const handleSavePaymentSettings = async () => {
    setPaymentError('');
    setPaymentSuccess('');
    setPaymentSaving(true);

    try {
      const token = getAdminToken();
      if (!token) {
        setPaymentError('Not authenticated - try logging in again.');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/payment-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentSettings),
      });

      if (!response.ok) {
        setPaymentError(await describeError(response, 'Failed to save payment settings'));
        return;
      }

      setPaymentSuccess('Payment settings saved successfully!');
    } catch (err) {
      setPaymentError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsChanging(true);

    try {
      const token = getAdminToken();
      if (!token) {
        setPasswordError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <AdminProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Configure your admin panel and system settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">General</h2>
              <p className="text-sm text-slate-500 mt-1">
                This powers the site name and contact details shown on the header, footer, and contact page.
              </p>
            </div>
            <div className="px-6 py-6 space-y-4">
              {settingsError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {settingsError}
                </div>
              )}
              {settingsSuccess && (
                <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
                  {settingsSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  placeholder="Your business name"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  placeholder="A short description of your business"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  placeholder="support@example.com"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="021 123 4567"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    disabled={settingsLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@yourbusiness"
                    value={settings.instagram_handle}
                    onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                    disabled={settingsLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Auckland, New Zealand"
                  value={settings.location}
                  onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Area Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. We deliver and set up across Auckland..."
                  value={settings.service_area_note}
                  onChange={(e) => setSettings({ ...settings, service_area_note: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon–Fri 9am–5pm (leave blank to hide)"
                  value={settings.business_hours}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Shown in the footer and on the Contact page. Leave blank to hide it entirely.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Footer Note
                </label>
                <input
                  type="text"
                  placeholder="Made with care in Auckland, Aotearoa."
                  value={settings.footer_note}
                  onChange={(e) => setSettings({ ...settings, footer_note: e.target.value })}
                  disabled={settingsLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">The small line at the very bottom of every page, next to the copyright.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading || settingsSaving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {settingsSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              {passwordError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
                  {passwordSuccess}
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {isChanging ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Homepage Hero */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Homepage Hero</h2>
            <p className="text-sm text-slate-500 mt-1">
              The large banner text at the top of the homepage.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            {settingsError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
                {settingsSuccess}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Eyebrow (small label above the heading)
              </label>
              <input
                type="text"
                placeholder="Auckland Wedding Decorations"
                value={settings.hero_eyebrow}
                onChange={(e) => setSettings({ ...settings, hero_eyebrow: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="Beautiful spaces for your perfect day"
                value={settings.hero_heading}
                onChange={(e) => setSettings({ ...settings, hero_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <textarea
                placeholder="A sentence or two describing what you offer"
                value={settings.hero_subheading}
                onChange={(e) => setSettings({ ...settings, hero_subheading: e.target.value })}
                disabled={settingsLoading}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Payment Settings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Bank transfer details and card payment configuration, shown to customers at checkout.
              Stored separately from general settings and never exposed by the public settings endpoint.
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            {paymentError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                {paymentError}
              </div>
            )}
            {paymentSuccess && (
              <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
                {paymentSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Bank Transfer</h3>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={paymentSettings.bank_transfer_enabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_transfer_enabled: e.target.checked })}
                    disabled={paymentLoading}
                  />
                  Offer bank transfer at checkout
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Bloom and Vow Ltd"
                    value={paymentSettings.bank_account_name}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account_name: e.target.value })}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="12-3456-7890123-00"
                    value={paymentSettings.bank_account_number}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account_number: e.target.value })}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                This is the account customers pay INTO for a bank transfer - not an account the
                business pays out of. Shown directly to customers when they choose Bank Transfer at checkout.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Card Payments (Stripe)</h3>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={paymentSettings.stripe_enabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_enabled: e.target.checked })}
                    disabled={paymentLoading}
                  />
                  Offer card payment at checkout
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Requires a Stripe account. The secret key is set by a developer directly on the
                server (never here, for security) - see backend/README.md. Only turn this on once
                that&apos;s done, otherwise card payment will show an error at checkout.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  placeholder="pk_live_..."
                  value={paymentSettings.stripe_publishable_key}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_publishable_key: e.target.value })}
                  disabled={paymentLoading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Success URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://yoursite.com/cart?payment=success"
                    value={paymentSettings.stripe_success_url}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_success_url: e.target.value })}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cancel URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://yoursite.com/cart?payment=cancelled"
                    value={paymentSettings.stripe_cancel_url}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_cancel_url: e.target.value })}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  placeholder="NZD"
                  value={paymentSettings.currency}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value.toUpperCase() })}
                  disabled={paymentLoading}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSavePaymentSettings}
              disabled={paymentLoading || paymentSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {paymentSaving ? 'Saving...' : 'Save Payment Settings'}
            </button>
          </div>
        </div>

        {/* Homepage CTA banner */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Homepage Call-to-Action</h2>
            <p className="text-sm text-slate-500 mt-1">
              The banner near the bottom of the homepage that invites visitors to get in touch.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="Ready to bring your vision to life?"
                value={settings.cta_heading}
                onChange={(e) => setSettings({ ...settings, cta_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <input
                type="text"
                placeholder="Tell us about your wedding and we'll help you choose the perfect pieces."
                value={settings.cta_subheading}
                onChange={(e) => setSettings({ ...settings, cta_subheading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Rentals Page */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Rentals Page</h2>
            <p className="text-sm text-slate-500 mt-1">
              The banner at the top of the Rentals page.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Eyebrow (small label above the heading)
              </label>
              <input
                type="text"
                placeholder="Decoration Rentals"
                value={settings.rentals_eyebrow}
                onChange={(e) => setSettings({ ...settings, rentals_eyebrow: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="Rent the Perfect Setting"
                value={settings.rentals_heading}
                onChange={(e) => setSettings({ ...settings, rentals_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <textarea
                placeholder="Choose from our collection of floral arches, backdrops, benches, and more."
                value={settings.rentals_subheading}
                onChange={(e) => setSettings({ ...settings, rentals_subheading: e.target.value })}
                disabled={settingsLoading}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">The Service Area Note from the General card is appended automatically after this.</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Shop Page */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Shop Page</h2>
            <p className="text-sm text-slate-500 mt-1">
              The banner at the top of the Shop page.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Eyebrow (small label above the heading)
              </label>
              <input
                type="text"
                placeholder="Wedding Shop"
                value={settings.shop_eyebrow}
                onChange={(e) => setSettings({ ...settings, shop_eyebrow: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="Keepsakes & Personalized Gifts"
                value={settings.shop_heading}
                onChange={(e) => setSettings({ ...settings, shop_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <textarea
                placeholder="Personalized glasses, ring boxes, and hand-crafted bouquets..."
                value={settings.shop_subheading}
                onChange={(e) => setSettings({ ...settings, shop_subheading: e.target.value })}
                disabled={settingsLoading}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Contact Page */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Contact Page</h2>
            <p className="text-sm text-slate-500 mt-1">
              The banner and intro text on the Contact page (the contact details themselves come from the General card above).
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Banner Heading
              </label>
              <input
                type="text"
                placeholder="Get in Touch"
                value={settings.contact_heading}
                onChange={(e) => setSettings({ ...settings, contact_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Banner Subheading
              </label>
              <input
                type="text"
                placeholder="Questions about rentals, custom requests, or just want to say hello?"
                value={settings.contact_subheading}
                onChange={(e) => setSettings({ ...settings, contact_subheading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Intro Heading
              </label>
              <input
                type="text"
                placeholder="We'd love to hear from you"
                value={settings.contact_intro_heading}
                onChange={(e) => setSettings({ ...settings, contact_intro_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Intro Text
              </label>
              <textarea
                placeholder="Whether you're planning a wedding..."
                value={settings.contact_intro_text}
                onChange={(e) => setSettings({ ...settings, contact_intro_text: e.target.value })}
                disabled={settingsLoading}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* About Page */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">About Page</h2>
            <p className="text-sm text-slate-500 mt-1">
              The &quot;Our Story&quot; heading and text on the About page. Leave a blank
              line between paragraphs.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="Our Story"
                value={settings.about_heading}
                onChange={(e) => setSettings({ ...settings, about_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <input
                type="text"
                placeholder="A passion for beautiful weddings..."
                value={settings.about_subheading}
                onChange={(e) => setSettings({ ...settings, about_subheading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Story
              </label>
              <textarea
                placeholder="Tell customers about your business..."
                value={settings.about_story}
                onChange={(e) => setSettings({ ...settings, about_story: e.target.value })}
                disabled={settingsLoading}
                rows={10}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* How It Works Page */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">How It Works Page</h2>
            <p className="text-sm text-slate-500 mt-1">
              The banner heading and subheading at the top of the How It Works page.
            </p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                placeholder="How It Works"
                value={settings.how_it_works_heading}
                onChange={(e) => setSettings({ ...settings, how_it_works_heading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subheading
              </label>
              <input
                type="text"
                placeholder="Renting decorations should be simple..."
                value={settings.how_it_works_subheading}
                onChange={(e) => setSettings({ ...settings, how_it_works_subheading: e.target.value })}
                disabled={settingsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading || settingsSaving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {settingsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AdminProtectedLayout>
  );
}
