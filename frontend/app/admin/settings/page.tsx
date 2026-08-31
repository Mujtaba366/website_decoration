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
  hero_eyebrow: string;
  hero_heading: string;
  hero_subheading: string;
}

const emptySettings: SiteSettingsForm = {
  site_name: '',
  tagline: '',
  support_email: '',
  phone: '',
  location: '',
  instagram_handle: '',
  service_area_note: '',
  hero_eyebrow: '',
  hero_heading: '',
  hero_subheading: '',
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettingsForm>(emptySettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

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
            hero_eyebrow: data.hero_eyebrow || '',
            hero_heading: data.hero_heading || '',
            hero_subheading: data.hero_subheading || '',
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
      </div>
    </AdminProtectedLayout>
  );
}
