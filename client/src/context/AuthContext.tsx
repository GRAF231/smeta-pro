import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import { STORAGE_KEYS } from '../constants/storage'
import type { User } from '../types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication context provider
 * 
 * Manages user authentication state, login, registration, and logout functionality.
 * Automatically checks for existing authentication token on mount and validates it.
 * 
 * @example
 * ```tsx
 * import { AuthProvider } from '@/context/AuthContext'
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   )
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await api.post('/auth/register', { email, password, name })
    const { token, user } = res.data
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to access authentication context
 * 
 * Provides access to current user, loading state, and authentication methods.
 * Must be used within an AuthProvider component.
 * 
 * @returns Authentication context containing:
 * - `user` - Current authenticated user or null
 * - `isLoading` - Whether authentication state is being checked
 * - `login` - Function to log in with email and password
 * - `register` - Function to register a new user
 * - `logout` - Function to log out current user
 * 
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * import { useAuth } from '@/context/AuthContext'
 * 
 * function MyComponent() {
 *   const { user, login, logout } = useAuth()
 *   
 *   if (!user) {
 *     return <LoginForm onSubmit={login} />
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 */

