import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Main layout component for the application
 * 
 * Provides the common structure for all pages including:
 * - Header with navigation and user menu
 * - Main content area (via Outlet)
 * - Footer
 * 
 * Handles authentication state and logout functionality.
 * 
 * @example
 * Used as a route wrapper in App.tsx:
 * ```tsx
 * <Route path="/" element={<Layout />}>
 *   <Route index element={<Home />} />
 *   <Route path="dashboard" element={<Dashboard />} />
 * </Route>
 * ```
 */
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-xl text-white">СметаПро</span>
            </Link>

            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                    Мои проекты
                  </Link>
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                    <span className="text-sm text-slate-400">{user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2">
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-700/50 py-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          © 2026 СметаПро. Сервис составления и отображения смет на ремонт.
        </div>
      </footer>
    </div>
  )
}

