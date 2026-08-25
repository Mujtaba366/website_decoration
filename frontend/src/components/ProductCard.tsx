import type { Product } from '../types'
import { Card, Button } from '../components/ui'
import { Link } from 'react-router-dom'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const href = product.type === 'rental' ? `/product/${product.slug}` : `/item/${product.slug}`
  return (
    <Link to={href} className="no-underline">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-square bg-slate-100 overflow-hidden">
          {product.images && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">${product.base_price.toFixed(2)}</span>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded capitalize">
              {product.type === 'rental' ? 'Rental' : 'Shop'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
