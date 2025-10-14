import React from 'react'
import { useRTL } from '../hooks/useRTL'

export interface RTLNumberProps {
  value: number
  format?: 'number' | 'currency' | 'percent'
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * RTL-aware number formatting component
 * Automatically formats numbers according to the current language locale
 */
export function RTLNumber({
  value,
  format = 'number',
  currency = 'USD',
  minimumFractionDigits,
  maximumFractionDigits,
  className,
  style,
}: RTLNumberProps) {
  const { formatNumber } = useRTL()

  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits,
    maximumFractionDigits,
  }

  if (format === 'currency') {
    formatOptions.style = 'currency'
    formatOptions.currency = currency
  } else if (format === 'percent') {
    formatOptions.style = 'percent'
  }

  const formattedValue = formatNumber(value, formatOptions)

  return (
    <span 
      className={`number-display ${className || ''}`}
      style={{
        direction: 'ltr',
        unicodeBidi: 'embed',
        ...style
      }}
    >
      {formattedValue}
    </span>
  )
}

export interface RTLDateProps {
  date: Date
  format?: 'short' | 'medium' | 'long' | 'full'
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle']
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle']
  className?: string
  style?: React.CSSProperties
}

/**
 * RTL-aware date formatting component
 * Automatically formats dates according to the current language locale
 */
export function RTLDate({
  date,
  format = 'medium',
  dateStyle,
  timeStyle,
  className,
  style,
}: RTLDateProps) {
  const { formatDate } = useRTL()

  const formatOptions: Intl.DateTimeFormatOptions = {}

  if (dateStyle || timeStyle) {
    formatOptions.dateStyle = dateStyle
    formatOptions.timeStyle = timeStyle
  } else {
    switch (format) {
      case 'short':
        formatOptions.dateStyle = 'short'
        break
      case 'medium':
        formatOptions.dateStyle = 'medium'
        break
      case 'long':
        formatOptions.dateStyle = 'long'
        break
      case 'full':
        formatOptions.dateStyle = 'full'
        break
    }
  }

  const formattedDate = formatDate(date, formatOptions)

  return (
    <span 
      className={`date-display ${className || ''}`}
      style={style}
    >
      {formattedDate}
    </span>
  )
}