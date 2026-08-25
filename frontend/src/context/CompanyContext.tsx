import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Company } from '@types'
import { companyApi } from '@lib/api'

interface CompanyContextType {
  currentCompany: Company | null
  setCurrentCompany: (company: Company | null) => void
  companies: Company[]
  setCompanies: (companies: Company[]) => void
  isLoading: boolean
  error: string | null
  fetchCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await companyApi.list()
      setCompanies(Array.isArray(data) ? data : data?.results || [])
      if (companies.length === 0 && Array.isArray(data) && data.length > 0) {
        setCurrentCompany(data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        setCurrentCompany,
        companies,
        setCompanies,
        isLoading,
        error,
        fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}
