import React from 'react'
import { clsx } from 'clsx'
import { useI18n, useTranslation } from './i18n-provider'

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
  const { t } = useTranslation()
  const { cultures, currentCulture, setCurrentCulture, isLoading } = useI18n()

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value
    await setCurrentCulture(newLanguage)
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        {t('common.loading')}
      </div>
    )
  }

  return (
    <select
      value={currentCulture}
      onChange={handleLanguageChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={clsx(
        'border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        variant === 'compact' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-base',
        className
      )}
    >
      {cultures.map((culture) => (
        <option key={culture.code} value={culture.code}>
          {culture.displayName}
        </option>
      ))}
    </select>
  )
}
