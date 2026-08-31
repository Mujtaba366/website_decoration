'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden border-border/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute top-3 left-3">
            <Badge
              variant="secondary"
              className={
                product.type === 'rental'
                  ? 'bg-sage-100 text-sage-700 border-sage-200'
                  : 'bg-blush-100 text-blush-700 border-blush-200'
              }
            >
              {product.type === 'rental' ? 'For Rent' : 'For Sale'}
            </Badge>
          </div>
        </div>
        <CardContent className="pt-4 pb-2">
          {product.category && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {product.category}
            </p>
          )}
          <h3 className="font-serif text-lg font-semibold text-sage-800 group-hover:text-sage-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="pt-0 pb-4 px-6">
          <div className="flex items-center justify-between w-full">
            <span className="font-serif text-xl font-semibold text-sage-700">
              ${product.base_price.toFixed(0)}
              {product.type === 'rental' && (
                <span className="text-xs text-muted-foreground font-sans ml-1">/ weekend</span>
              )}
            </span>
            <span className="text-xs text-sage-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View details →
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
