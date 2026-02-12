import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import { PageSpinner } from './components/ui/Spinner'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectForm from './pages/ProjectForm'
import ProjectEditor from './pages/ProjectEditor'
import EstimatePage from './pages/EstimatePage'
import ActPage from './pages/ActPage'
import ActsPage from './pages/ActsPage'
import AiEstimateGenerator from './pages/AiEstimateGenerator'
import TestPageClassification from './pages/TestPageClassification'
import PublicView from './pages/PublicView'
import MaterialsPage from './pages/MaterialsPage'
import ProtectedRoute from './components/ProtectedRoute'

// Legacy redirect components for backward compatibility
function LegacyCustomerRedirect() {
  const { token } = useParams<{ token: string }>()
  return <Navigate to={`/v/${token}`} replace />
}

function LegacyMasterRedirect() {
  const { token } = useParams<{ token: string }>()
  return <Navigate to={`/v/${token}`} replace />
}

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/new"
          element={
            <ProtectedRoute>
              <ProjectForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/generate"
          element={
            <ProtectedRoute>
              <AiEstimateGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="test-classification"
          element={
            <ProtectedRoute>
              <TestPageClassification />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/edit"
          element={
            <ProtectedRoute>
              <ProjectEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/estimate"
          element={
            <ProtectedRoute>
              <EstimatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/acts"
          element={
            <ProtectedRoute>
              <ActsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/act"
          element={
            <ProtectedRoute>
              <ActPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:id/materials"
          element={
            <ProtectedRoute>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Universal public view */}
      <Route path="/v/:token" element={<PublicView />} />
      {/* Legacy backward compatibility redirects */}
      <Route path="/c/:token" element={<LegacyCustomerRedirect />} />
      <Route path="/m/:token" element={<LegacyMasterRedirect />} />
    </Routes>
  )
}

export default App
