import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider, QueryProvider, i18n } from '@l4h/shared-ui'
import App from './App'
import './index.css'

// Remove basename to allow direct routing without prefix
// All routes will be served from the root path
console.log('i18n initialized:', i18n.isInitialized)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <QueryProvider>
            <App />
          </QueryProvider>
        </ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  </React.StrictMode>
)