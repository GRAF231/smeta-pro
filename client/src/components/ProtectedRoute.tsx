import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReactNode } from 'react'

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Child components to render if user is authenticated */
  children: ReactNode
}

/**
 * Protected route wrapper component
 * 
 * Ensures that only authenticated users can access the wrapped route.
 * Redirects to login page if user is not authenticated, preserving the
 * intended destination in location state for redirect after login.
 * 
 * @example
 * ```tsx
 * <Route
 *   path="dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

