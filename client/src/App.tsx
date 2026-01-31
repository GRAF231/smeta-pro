import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EstimateForm from './pages/EstimateForm'
import CustomerView from './pages/CustomerView'
import MasterView from './pages/MasterView'
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
          path="estimates/new"
          element={
            <ProtectedRoute>
              <EstimateForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="estimates/:id/edit"
          element={
            <ProtectedRoute>
              <EstimateForm />
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

