'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Truck, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApi } from '@/hooks/use-api';
import { productsAPI } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';

export default function Home() {
  const { data: allProducts = [], loading } = useApi(() => productsAPI.list(), []);

  // Get first 6 featured products
  const featured = Array.isArray(allProducts) ? allProducts.slice(0, 6) : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/14703685/pexels-photo-14703685.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <div className="animate-fade-in-up">
            <p className="text-blush-200 text-sm md:text-base font-medium tracking-[0.3em] uppercase mb-4">
              Auckland Wedding Decorations
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold text-white text-balance max-w-4xl leading-[1.1]">
              Beautiful spaces for your perfect day
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Stunning floral arches, backdrops, and table settings for rent.
              Personalized keepsakes for your wedding. We set it up — you say &ldquo;I do.&rdquo;
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/rentals">
                <Button size="lg" className="bg-sage-700 hover:bg-sage-800 text-white px-8">
                  Browse Rentals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/40 text-white hover:bg-white/20 hover:text-white px-8">
                  Shop Keepsakes
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Feature highlights */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: 'We Set It Up', desc: 'Full delivery and setup within Auckland — your venue, perfectly styled.' },
            { icon: Calendar, title: 'Real-Time Availability', desc: 'Check dates and reserve instantly. No back-and-forth, no guesswork.' },
            { icon: Heart, title: 'With Care', desc: 'We care deeply about every detail of your day and your perfect venue.' },
          ].map((f, i) => (
            <Card key={i} className="border-border/50 shadow-lg bg-card/95 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-sage-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-sage-800">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-blush-600 text-sm font-medium tracking-[0.2em] uppercase mb-3">Our Collection</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-sage-800">Featured Pieces</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            A curated selection of our most-loved rentals and keepsakes.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/rentals">
            <Button variant="outline" size="lg" className="border-sage-300 text-sage-700 hover:bg-sage-50">
              View All Rentals <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/17206082/pexels-photo-17206082.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080')",
          }}
        />
        <div className="absolute inset-0 bg-sage-900/60" />
        <div className="relative z-10 py-24 text-center px-4">
          <Sparkles className="h-8 w-8 text-blush-300 mx-auto mb-4" />
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white max-w-2xl mx-auto text-balance">
            Ready to bring your vision to life?
          </h2>
          <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
            Tell us about your wedding and we&apos;ll help you choose the perfect pieces.
          </p>
          <Link href="/contact">
            <Button size="lg" className="mt-8 bg-blush-500 hover:bg-blush-600 text-white px-8">
              Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
