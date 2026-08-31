'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api-client';
import type { SiteSettings } from '@/lib/types';

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Bloom & Vow',
  tagline: 'Wedding decoration rentals and personalized keepsakes for couples across Auckland.',
  support_email: 'hello@bloomandvow.co.nz',
  phone: '021 123 4567',
  location: 'Auckland, New Zealand',
  logo_url: null,
  instagram_handle: '@bloomandvow',
  service_area_note: 'We deliver and set up across Auckland, or you can pick it up yourself.',
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const data = await settingsAPI.get() as Partial<SiteSettings>;
        if (data && data.site_name) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } catch {
        // Keep defaults if the backend isn't reachable.
      }
    })();
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
