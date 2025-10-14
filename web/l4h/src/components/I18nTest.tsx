import React from 'react'
import { useTranslation } from 'react-i18next'
import { useI18n } from '@l4h/shared-ui'

export function I18nTest() {
  const { t: tCommon } = useTranslation('common')
  const { t: tInterview } = useTranslation('interview')
  const { t: tErrors } = useTranslation('errors')
  const { currentCulture, isRTL, setCurrentCulture, cultures } = useI18n()

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentCulture(event.target.value)
  }

  return (
    <div className={`p-4 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
      <h2 className="text-xl font-bold mb-4">
        {tCommon('nav.interview')} - i18n Test
      </h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {tCommon('select')} Language:
        </label>
        <select 
          value={currentCulture} 
          onChange={handleLanguageChange}
          className="border rounded px-3 py-2"
        >
          {cultures.map(culture => (
            <option key={culture.code} value={culture.code}>
              {culture.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p><strong>Current Language:</strong> {currentCulture}</p>
        <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
        <p><strong>Direction:</strong> {isRTL ? 'Right-to-Left' : 'Left-to-Right'}</p>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Common Namespace:</h3>
        <p>{tCommon('loading')}</p>
        <p>{tCommon('nav.dashboard')}</p>
        <p>{tCommon('auth.login')}</p>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Interview Namespace:</h3>
        <p>{tInterview('title')}</p>
        <p>{tInterview('progress.title')}</p>
        <p>{tInterview('buttons.next')}</p>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Errors Namespace:</h3>
        <p>{tErrors('network.timeout')}</p>
        <p>{tErrors('interview.sessionExpired')}</p>
        <p>{tErrors('validation.required')}</p>
      </div>
    </div>
  )
}