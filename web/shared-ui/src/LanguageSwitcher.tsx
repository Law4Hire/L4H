import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { loadSupportedCultures, setCulture, Culture } from './i18n'

export interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export function LanguageSwitcher({ 
  variant = 'full',
  className,
  'aria-label': ariaLabel = 'Select language',
  'aria-describedby': ariaDescribedBy,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const [cultures, setCultures] = useState<Culture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCultures = async () => {
      try {
        const supportedCultures = await loadSupportedCultures()
        setCultures(supportedCultures)
      } catch (error) {
        console.error('Failed to load cultures:', error)
        // Fallback to default cultures
        setCultures([
          { code: 'en', displayName: 'English' },
          { code: 'es', displayName: 'Spanish' },
          { code: 'ar-SA', displayName: 'Arabic' },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadCultures()
  }, [])

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value
    try {
      await setCulture(newLanguage)
    } catch (error) {
      console.error('Failed to set culture:', error)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <select
      value={i18n.language}
      onChange={handleLanguageChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={clsx(
        'border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        variant === 'compact' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-base',
        className
      )}
    >
      {cultures?.map((culture) => (
        <option key={culture.code} value={culture.code}>
          {culture.displayName}
        </option>
      )) || []}
    </select>
  )
}
