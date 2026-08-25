import React from 'react'
import { cn } from '../lib/utils'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
  className?: string
  rowClassName?: (row: T) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  onRowClick,
  className,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-brand-600">⟳</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    )
  }

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-6 py-3 text-sm font-semibold text-gray-900',
                  alignmentClass[column.align || 'left']
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-gray-200 hover:bg-gray-50 transition-colors',
                onRowClick && 'cursor-pointer',
                rowClassName?.(row)
              )}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={cn(
                    'px-6 py-4 text-sm text-gray-900',
                    alignmentClass[column.align || 'left']
                  )}
                >
                  {column.render
                    ? column.render(row[column.key as keyof T], row)
                    : String(row[column.key as keyof T] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
