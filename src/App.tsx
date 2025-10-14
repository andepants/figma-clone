/**
 * @fileoverview Main application component with routing configuration.
 * Sets up routes for landing page and protected canvas page.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CanvasPage from './pages/CanvasPage'
import { ProtectedRoute } from './features/auth/components'
import { ErrorBoundary } from './components/common'

/**
 * Root application component with routing and error boundary.
 * @returns The main app with configured routes
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/canvas"
            element={
              <ProtectedRoute>
                <CanvasPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
