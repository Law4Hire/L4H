import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {IconComponent && (
        <div className="mb-4">
          <IconComponent className="h-12 w-12 text-gray-400" aria-hidden="true" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}