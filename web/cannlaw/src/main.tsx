import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider, CannlawI18nProvider } from '@l4h/shared-ui'
import App from './App'
import './index.css'

// CannlawI18nProvider handles culture loading automatically with Cannlaw-specific namespaces
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QueryProvider>
          <CannlawI18nProvider 
            preloadNamespaces={['common', 'errors', 'auth']}
            additionalNamespaces={['legal', 'billing', 'clients', 'cases']}
          >
            <App />
          </CannlawI18nProvider>
        </QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
