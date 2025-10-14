import React, { useState } from 'react'
import { useTranslationErrorHandling } from './hooks/useTranslationErrorHandling'
import { translationErrorHandler } from './translation-error-handler'
import TranslationErrorNotification from './components/TranslationErrorNotification'

export function TranslationErrorDemo() {
  const [selectedLanguage, setSelectedLanguage] = useState('fr-FR')
  const [selectedNamespace, setSelectedNamespace] = useState('interview')
  
  const {
    hasErrors,
    isFallbackActive,
    isRetrying,
    canRetry,
    showNotification,
    retry,
    dismissNotification,
    loadingState,
    retryCount,
    failedLanguages
  } = useTranslationErrorHandling(selectedLanguage, selectedNamespace)

  const simulateError = () => {
    const error = new Error(`Simulated network error for ${selectedLanguage}/${selectedNamespace}`)
    translationErrorHandler.recordError(selectedLanguage, selectedNamespace, error)
  }

  const simulateSuccess = () => {
    translationErrorHandler.recordSuccess(selectedLanguage, selectedNamespace)
  }

  const simulateLoading = () => {
    translationErrorHandler.startLoading(selectedLanguage, selectedNamespace)
  }

  const clearAllErrors = () => {
    translationErrorHandler.clearErrors()
  }

  const errorStats = translationErrorHandler.getErrorStats()

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Translation Error Handling Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Controls</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Language: 
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{ marginLeft: '10px' }}
            >
              <option value="fr-FR">French (fr-FR)</option>
              <option value="es-ES">Spanish (es-ES)</option>
              <option value="de-DE">German (de-DE)</option>
              <option value="ar-SA">Arabic (ar-SA)</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Namespace: 
            <select 
              value={selectedNamespace} 
              onChange={(e) => setSelectedNamespace(e.target.value)}
              style={{ marginLeft: '10px' }}
            >
              <option value="interview">Interview</option>
              <option value="common">Common</option>
              <option value="errors">Errors</option>
            </select>
          </label>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={simulateLoading}>Simulate Loading</button>
          <button onClick={simulateError}>Simulate Error</button>
          <button onClick={simulateSuccess}>Simulate Success</button>
          <button onClick={retry} disabled={!canRetry || isRetrying}>
            {isRetrying ? 'Retrying...' : 'Manual Retry'}
          </button>
          <button onClick={clearAllErrors}>Clear All Errors</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Current State</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Has Errors:</strong> {hasErrors ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Fallback Active:</strong> {isFallbackActive ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Is Retrying:</strong> {isRetrying ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Can Retry:</strong> {canRetry ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Show Notification:</strong> {showNotification ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Retry Count:</strong> {retryCount}
          </div>
        </div>
        
        {failedLanguages.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Failed Languages:</strong> {failedLanguages.join(', ')}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Loading State Details</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          {JSON.stringify(loadingState, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Global Error Statistics</h3>
        <div>
          <strong>Total Errors:</strong> {errorStats.totalErrors}
        </div>
        <div>
          <strong>Recent Errors:</strong> {errorStats.recentErrors.length}
        </div>
        
        {Object.keys(errorStats.errorsByLanguage).length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Errors by Language:</strong>
            <ul>
              {Object.entries(errorStats.errorsByLanguage).map(([lang, count]) => (
                <li key={lang}>{lang}: {count}</li>
              ))}
            </ul>
          </div>
        )}
        
        {Object.keys(errorStats.errorsByNamespace).length > 0 && (
          <div>
            <strong>Errors by Namespace:</strong>
            <ul>
              {Object.entries(errorStats.errorsByNamespace).map(([ns, count]) => (
                <li key={ns}>{ns}: {count}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3>Instructions</h3>
        <ol>
          <li>Select a language and namespace combination</li>
          <li>Click "Simulate Error" to trigger an error for that combination</li>
          <li>Notice how the error state updates and a notification appears</li>
          <li>Try "Manual Retry" to retry loading</li>
          <li>Simulate multiple errors to see retry count increase and fallback activation</li>
          <li>Use "Simulate Success" to clear error state</li>
          <li>Try different language/namespace combinations to see independent error tracking</li>
        </ol>
      </div>

      {/* Error notification will appear here */}
      {showNotification && (
        <TranslationErrorNotification
          language={selectedLanguage}
          onRetry={retry}
          onDismiss={dismissNotification}
        />
      )}
    </div>
  )
}

export default TranslationErrorDemo