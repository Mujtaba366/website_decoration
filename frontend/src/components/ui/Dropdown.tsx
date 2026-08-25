import React, { useRef, useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import { ChevronDown } from 'lucide-react'

export interface DropdownItem {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface DropdownProps {
  items: DropdownItem[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Dropdown({
  items,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedItem = items.find((item) => item.value === value)

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'input-base w-full flex items-center justify-between',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span>{selectedItem?.label || placeholder}</span>
        <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onChange?.(item.value)
                setIsOpen(false)
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors',
                value === item.value && 'bg-brand-50 text-brand-700',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
