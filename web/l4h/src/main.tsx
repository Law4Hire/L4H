import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider, I18nProvider } from '@l4h/shared-ui'
import App from './App'
import './index.css'
// Import RTL styles for proper right-to-left language support
import '../../shared-ui/src/styles/rtl.css'

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
