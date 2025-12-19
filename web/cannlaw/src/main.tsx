import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider, QueryProvider } from '@l4h/shared-ui'
import { AuthProvider } from './hooks/useAuth'
import i18n from './i18n'
import App from './App'
import './index.css'

// Log initialization status
console.log('i18n initialized:', i18n.isInitialized)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  </React.StrictMode>
)