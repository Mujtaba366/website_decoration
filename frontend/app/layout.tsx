import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartProvider } from '@/components/cart-context';
import { SiteSettingsProvider } from '@/components/site-settings-context';
import { Toaster } from '@/components/ui/sonner';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://website-decoration.onrender.com'),
  title: 'Bloom & Vow — Wedding Decoration Rentals & Shop',
  description:
    'Auckland-based wedding decoration rentals and personalized shop items. Arches, backdrops, florals, benches, and more — we set it up or you pick it up.',
  openGraph: {
    images: [{ url: 'https://images.pexels.com/photos/14703685/pexels-photo-14703685.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://images.pexels.com/photos/14703685/pexels-photo-14703685.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <SiteSettingsProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <Toaster />
          </CartProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
