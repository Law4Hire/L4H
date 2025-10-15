import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider, I18nProvider } from '@l4h/shared-ui'
import App from './App'
import './index.css'
// Import RTL styles for proper right-to-left language support
import '../../shared-ui/src/styles/rtl.css'

// Remove basename to allow direct routing without prefix
// All routes will be served from the root path
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
