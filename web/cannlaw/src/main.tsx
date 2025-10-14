import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider, I18nProvider, loadSupportedCultures } from '@l4h/shared-ui'
import App from './App'
import './i18n'
import './index.css'

// Load supported cultures from the API
loadSupportedCultures().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
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
