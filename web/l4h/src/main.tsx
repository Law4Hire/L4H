import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider, I18nProvider, i18n, loadSupportedCultures } from '@l4h/shared-ui'
import App from './App'
import './index.css'

// Ensure i18n is initialized
console.log('i18n initialized:', i18n.isInitialized)

// Load supported cultures from the API
loadSupportedCultures().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename="/law4hire">
        <ThemeProvider>
          <QueryProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
});
