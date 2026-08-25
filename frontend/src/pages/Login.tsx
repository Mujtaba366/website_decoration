import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, Input, Form, FormGroup, FormLabel } from '../components/ui'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement Supabase authentication
      console.log('Login:', { email, password })
      navigate('/')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business App</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Login</h2>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <FormGroup>
                <FormLabel required>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel required>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormGroup>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Sign in
              </Button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
                    Sign up
                  </a>
                </p>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
