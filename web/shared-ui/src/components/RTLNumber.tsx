import React from 'react'
import { useRTL } from '../hooks/useRTL'

export interface RTLNumberProps {
  value: number
  format?: 'number' | 'currency' | 'percent' | 'filesize' | 'duration'
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  binary?: boolean // For file size formatting
  durationStyle?: 'long' | 'short' | 'narrow' // For duration formatting
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
  binary = false,
  durationStyle = 'short',
  className,
  style,
}: RTLNumberProps) {
  const { formatNumber, formatCurrency, formatPercentage, formatFileSize, formatDuration } = useRTL()

  let formattedValue: string

  switch (format) {
    case 'currency':
      formattedValue = formatCurrency(value, currency, {
        minimumFractionDigits,
        maximumFractionDigits,
      })
      break
    case 'percent':
      formattedValue = formatPercentage(value, {
        minimumFractionDigits,
        maximumFractionDigits,
      })
      break
    case 'filesize':
      formattedValue = formatFileSize(value, { binary })
      break
    case 'duration':
      formattedValue = formatDuration(value, { style: durationStyle })
      break
    default:
      formattedValue = formatNumber(value, {
        minimumFractionDigits,
        maximumFractionDigits,
      })
      break
  }

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

export interface RTLRelativeTimeProps {
  date: Date
  numeric?: 'always' | 'auto'
  formatStyle?: 'long' | 'short' | 'narrow'
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

/**
 * RTL-aware relative time formatting component
 * Automatically formats relative time according to the current language locale
 */
export function RTLRelativeTime({
  date,
  numeric = 'auto',
  formatStyle: relativeStyle = 'long',
  className,
  style,
}: RTLRelativeTimeProps) {
  const { formatRelativeTime } = useRTL()

  const formattedTime = formatRelativeTime(date, {
    numeric,
    style: relativeStyle,
  })

  return (
    <span 
      className={`relative-time-display ${className || ''}`}
      style={style}
      title={date.toLocaleString()}
    >
      {formattedTime}
    </span>
  )
}