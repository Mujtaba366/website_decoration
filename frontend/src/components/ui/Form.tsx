import React from 'react'
import { cn } from '../lib/utils'

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => (
    <form ref={ref} className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  )
)

Form.displayName = 'Form'

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  )
)

FormGroup.displayName = 'FormGroup'

interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number
  children: React.ReactNode
}

export const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, columns = 2, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(`grid grid-cols-${columns} gap-4`, className)}
      {...props}
    >
      {children}
    </div>
  )
)

FormRow.displayName = 'FormRow'

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
}

export const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ message, className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-red-600', className)} {...props}>
      {message}
    </p>
  )
)

FormError.displayName = 'FormError'

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn('text-sm font-medium text-gray-700', className)} {...props}>
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  )
)

FormLabel.displayName = 'FormLabel'
