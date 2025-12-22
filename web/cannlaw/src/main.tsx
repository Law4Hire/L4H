import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, QueryProvider } from '@l4h/shared-ui'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './index.css'

// Log initialization status

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)