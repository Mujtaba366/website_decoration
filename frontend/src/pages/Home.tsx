import { Link } from 'react-router-dom'
import { Button } from '@components/ui'

export function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 -mx-6 -mt-20">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Beautiful Celebrations Start Here
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Stunning decoration rentals and personalized wedding items for your special day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/rentals">
              <Button className="px-8 py-3">Explore Rentals</Button>
            </Link>
            <Link to="/shop">
              <Button variant="secondary" className="px-8 py-3">Browse Shop</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg border">
            <h3 className="text-2xl font-bold mb-4">Decoration Rentals</h3>
            <p className="text-gray-600 mb-4">
              Beautiful arches, backdrops, and floral arrangements for your event. Choose setup or pickup.
            </p>
            <Link to="/rentals" className="text-brand-600 font-semibold hover:underline">
              View Rentals →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg border">
            <h3 className="text-2xl font-bold mb-4">Wedding Shop</h3>
            <p className="text-gray-600 mb-4">
              Personalized glasses, napkins, and favors to make your celebration uniquely yours.
            </p>
            <Link to="/shop" className="text-brand-600 font-semibold hover:underline">
              Browse Shop →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-600 text-white py-12 px-4 rounded-lg max-w-6xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Plan Your Event?</h2>
          <p className="text-lg mb-6 opacity-90">
            Contact us today for custom quotes and special requests
          </p>
          <Button className="bg-white text-brand-600 hover:bg-gray-100">
            Get in Touch
          </Button>
        </div>
      </section>
    </div>
  )
}
