import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CanvasPage from './pages/CanvasPage'
import { ProtectedRoute } from './features/auth/components'
import { ErrorBoundary } from './components/common'
import { Toaster } from './components/ui/sonner'

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
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
