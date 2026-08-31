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
  hero_eyebrow: 'Auckland Wedding Decorations',
  hero_heading: 'Beautiful spaces for your perfect day',
  hero_subheading: 'Stunning floral arches, backdrops, and table settings for rent. Personalized keepsakes for your wedding. We set it up — you say "I do."',
  about_heading: 'Our Story',
  about_subheading: 'A passion for beautiful weddings and creating unforgettable moments.',
  about_story:
    "Based right here in Auckland, what started as helping a friend style their wedding venue turned into a full-blown obsession with creating beautiful spaces for couples on their big day.\n\n" +
    "We know firsthand how stressful wedding planning can be. There's the budget, the timeline, the endless decisions. That's why we keep things simple: beautiful decorations, fair prices, and we handle the heavy lifting — literally. You pick what you love, we set it up, and you walk into a venue that takes your breath away.\n\n" +
    "Every piece in our collection has been hand-picked and styled with care. We're not a big rental warehouse — we care about every single booking. When you rent from us, you're not just getting decorations. You're getting our time, our attention, and our promise that your venue will look exactly how you imagined it.",
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
