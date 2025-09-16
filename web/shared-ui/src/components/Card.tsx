import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  actions?: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  title, 
  actions,
  variant = 'default',
  padding = 'md'
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-none'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={clsx(
      'rounded-lg transition-shadow hover:shadow-md',
      variantClasses[variant],
      className
    )}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={clsx(
        paddingClasses[padding],
        title || actions ? '' : 'rounded-lg'
      )}>
        {children}
      </div>
    </div>
  )
}
