/**
 * @fileoverview Main application component with routing configuration.
 * Sets up routes for landing page and protected canvas page.
 */

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ProjectsPage from './pages/ProjectsPage'
import PublicProjectsPage from './pages/PublicProjectsPage'
import CanvasPage from './pages/CanvasPage'
import PublicPlaygroundPage from './pages/PublicPlaygroundPage'
import { ProtectedRoute } from './features/auth/components'
import { ErrorBoundary } from './components/common'
import { initConnectionMonitoring } from './lib/firebase'

/**
 * Root application component with routing and error boundary.
 * @returns The main app with configured routes
 */
function App() {
  // Initialize Firebase connection monitoring on app startup
  useEffect(() => {
    initConnectionMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/public-projects" element={<PublicProjectsPage />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/canvas"
            element={
              <ProtectedRoute>
                <PublicPlaygroundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/canvas/:projectId"
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
