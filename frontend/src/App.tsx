import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CompanyProvider } from '@context/CompanyContext'
import { Layout } from '@components/layout'
import { Home } from '@pages/Home'
import { Bills } from '@pages/Bills'
import { Purchases } from '@pages/Purchases'
import { Accounting } from '@pages/Accounting'
import { Reporting } from '@pages/Reporting'
import { Team } from '@pages/Team'
import { Settings } from '@pages/Settings'
import { Login } from '@pages/Login'
import { NotFound } from '@pages/NotFound'
import { authApi } from '@lib/api'

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/purchases"
        element={
          <Layout>
            <Purchases />
          </Layout>
        }
      />
      <Route
        path="/sales"
        element={
          <Layout>
            <div className="text-center py-12"><p className="text-gray-600">Sales page coming soon</p></div>
          </Layout>
        }
      />
      <Route
        path="/accounting"
        element={
          <Layout>
            <Accounting />
          </Layout>
        }
      />
      <Route
        path="/reporting"
        element={
          <Layout>
            <Reporting />
          </Layout>
        }
      />
      <Route
        path="/team"
        element={
          <Layout>
            <Team />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.getSession()
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-brand-600">⟳</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </BrowserRouter>
  )
}
