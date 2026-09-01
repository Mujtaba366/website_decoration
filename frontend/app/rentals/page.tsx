'use client';

import { useEffect, useState, useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { productsAPI } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSiteSettings } from '@/components/site-settings-context';

const rentalCategories = ['Arches', 'Backdrops', 'Benches', 'Florals', 'Table Settings', 'Signs'];

export default function RentalsPage() {
  const { service_area_note } = useSiteSettings();
  const { data: allProducts = [], loading } = useApi(() => productsAPI.list(), []);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  // Filter for rental type products
  const products = Array.isArray(allProducts) ? allProducts.filter((p: any) => p.type === 'rental') : [];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const catMatch = selectedCats.length === 0 || selectedCats.includes(p.category || '');
      const priceMatch = p.base_price >= priceRange[0] && p.base_price <= priceRange[1];
      return catMatch && priceMatch;
    });
  }, [products, selectedCats, priceRange]);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <p className="text-blush-600 text-sm font-medium tracking-[0.2em] uppercase mb-3">
          Decoration Rentals
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-sage-800">
          Rent the Perfect Setting
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Choose from our collection of floral arches, backdrops, benches, and more.{' '}
          {service_area_note}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="font-serif text-lg font-semibold text-sage-800 mb-4">
                Category
              </h3>
              <div className="space-y-3">
                {rentalCategories.map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat}`}
                      checked={selectedCats.includes(cat)}
                      onCheckedChange={() => toggleCat(cat)}
                    />
                    <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                      {cat}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold text-sage-800 mb-4">
                Price Range
              </h3>
              <div className="px-2">
                <Slider
                  min={0}
                  max={1000}
                  step={50}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="my-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}+</span>
                </div>
              </div>
            </div>

            {(selectedCats.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
              <button
                onClick={() => {
                  setSelectedCats([]);
                  setPriceRange([0, 1000]);
                }}
                className="text-sm text-sage-600 hover:text-sage-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No rentals match your filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'} available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
