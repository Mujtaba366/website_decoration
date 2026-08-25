import React from 'react'
import { cn } from '../lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center md:justify-between mb-8', className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-gray-600">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-4 md:mt-0">
          {action}
        </div>
      )}
    </div>
  )
}
