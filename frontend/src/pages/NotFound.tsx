import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-2xl font-semibold text-gray-900">Page not found</p>
        <p className="mt-4 text-gray-600">The page you're looking for doesn't exist.</p>
        <Button
          variant="primary"
          className="mt-8"
          onClick={() => navigate('/')}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
