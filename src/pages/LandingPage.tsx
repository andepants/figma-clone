/**
 * Landing Page
 *
 * Entry point for unauthenticated users.
 * Displays app information and provides authentication access.
 */

import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">CollabCanvas</h1>
        <p className="text-neutral-600 mb-8">Real-time collaborative canvas application</p>
        <Link
          to="/canvas"
          className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Go to Canvas
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
