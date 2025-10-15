/**
 * @fileoverview Application entry point.
 * Initializes React root with auth provider and strict mode.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/hooks'
import { installPerformanceUtils } from './utils/performanceTestUtils'

// Install performance testing utilities in development mode
if (import.meta.env.DEV) {
  installPerformanceUtils();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
