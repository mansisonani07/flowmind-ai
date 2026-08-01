import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  avatar?: string
  businessId?: string
  businessName?: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'flowmind-auth-user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = user !== null

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true)
    try {
      // TODO: Replace with real API call
      // Simulated login
      await new Promise((r) => setTimeout(r, 800))

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'admin',
      }

      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Call logout API
      await new Promise((r) => setTimeout(r, 300))
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback((updates: Partial<Pick<User, 'name' | 'avatar'>>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

/**
 * Shortcut hook for auth.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
  return useAuthContext()
}
