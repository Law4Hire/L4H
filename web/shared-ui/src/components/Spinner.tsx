import React from 'react'
import { clsx } from 'clsx'
import { Loader2 } from '../Icon'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  return (
    <Loader2 
      className={clsx(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )}
      data-testid="spinner"
      aria-hidden="true"
    />
  )
}
