import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectForm from './pages/ProjectForm'
import ProjectEditor from './pages/ProjectEditor'
import EstimatePage from './pages/EstimatePage'
import ActPage from './pages/ActPage'
import AiEstimateGenerator from './pages/AiEstimateGenerator'
import CustomerView from './pages/CustomerView'
import MasterView from './pages/MasterView'
import MaterialsPage from './pages/MaterialsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
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
      {/* Public estimate views */}
      <Route path="/c/:token" element={<CustomerView />} />
      <Route path="/m/:token" element={<MasterView />} />
    </Routes>
  )
}

export default App
