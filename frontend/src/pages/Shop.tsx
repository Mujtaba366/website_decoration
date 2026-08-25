import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { productApi } from '../lib/api'
import { ProductCard } from '@/components/ProductCard'
import { PageHeader } from '@/components/layout'

const CATEGORIES = ['Glassware', 'Table Settings', 'Favors', 'Signage']

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const response = await productApi.list({
          type: 'sale',
          ...(selectedCategory && { category: selectedCategory }),
        })
        // Handle both direct data and wrapped response
        const data = 'data' in response ? (response.data as Product[]) : (response as Product[])
        setProducts(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [selectedCategory])

  return (
    <div>
      <PageHeader title="Wedding Shop" description="Personalized items for your special day" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-12">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`block w-full text-left px-3 py-2 rounded transition ${
                  selectedCategory === null
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-slate-100'
                }`}
              >
                All Items
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`block w-full text-left px-3 py-2 rounded transition ${
                    selectedCategory === cat
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
          )}

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No items found in this category
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
