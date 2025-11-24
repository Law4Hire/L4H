import React from 'react'
import { useTranslation } from 'react-i18next'

interface RTLNumberProps {
  value: number
  format?: 'decimal' | 'currency' | 'percent'
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export const RTLNumber: React.FC<RTLNumberProps> = ({ 
  value, 
  format = 'decimal', 
  currency = 'USD',
  minimumFractionDigits,
  maximumFractionDigits
}) => {
  const { i18n } = useTranslation()
  
  const formattedValue = new Intl.NumberFormat(i18n.language, {
    style: format,
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value)

  return (
    <span className="rtl-number" dir="ltr">
      {formattedValue}
    </span>
  )
}
