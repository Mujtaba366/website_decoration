'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flower2, Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { useSiteSettings } from '@/components/site-settings-context';

export function SiteFooter() {
  const pathname = usePathname();
  const { site_name, tagline, support_email, phone, location, instagram_handle } = useSiteSettings();

  // Same reasoning as SiteHeader: admin pages shouldn't show the public
  // storefront footer (marketing links, social handles) below the admin UI.
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-border bg-sage-50/50 mt-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Flower2 className="h-6 w-6 text-sage-600" />
              <span className="font-serif text-xl font-semibold text-sage-800">
                {site_name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {tagline}
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold mb-4 text-sage-700">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rentals" className="text-muted-foreground hover:text-sage-700 transition-colors">Rentals</Link></li>
              <li><Link href="/shop" className="text-muted-foreground hover:text-sage-700 transition-colors">Shop</Link></li>
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-sage-700 transition-colors">How It Works</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-sage-700 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-sage-700 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold mb-4 text-sage-700">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {support_email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-sage-500" /> {support_email}
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-sage-500" /> {phone}
                </li>
              )}
              {location && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sage-500" /> {location}
                </li>
              )}
              {instagram_handle && (
                <li className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-sage-500" /> {instagram_handle}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {site_name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with care in Auckland, Aotearoa.
          </p>
        </div>
      </div>
    </footer>
  );
}
