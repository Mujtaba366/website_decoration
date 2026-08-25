import React from 'react'
import { cn } from '../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'input-base w-full',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
)

Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string
    error?: string
  }
>(({ className, label, error, ...props }, ref) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      className={cn(
        'input-base w-full resize-none',
        error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
))

Textarea.displayName = 'Textarea'
