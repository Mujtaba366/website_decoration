import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@components/layout'
import { Home } from '@pages/Home'
import { NotFound } from '@pages/NotFound'
import Rentals from '@pages/Rentals'
import Shop from '@pages/Shop'
import RentalDetail from '@pages/RentalDetail'
import ShopDetail from '@pages/ShopDetail'

function AppContent() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/rentals"
        element={
          <Layout>
            <Rentals />
          </Layout>
        }
      />
      <Route
        path="/shop"
        element={
          <Layout>
            <Shop />
          </Layout>
        }
      />
      <Route
        path="/product/:slug"
        element={
          <Layout>
            <RentalDetail />
          </Layout>
        }
      />
      <Route
        path="/item/:slug"
        element={
          <Layout>
            <ShopDetail />
          </Layout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
