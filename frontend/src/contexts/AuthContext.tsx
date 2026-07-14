import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: string
  status: string
  organization: {
    id: string
    name: string
    slug: string
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.data)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(user)
    navigate('/')
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    const { user, accessToken, refreshToken } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setUser(user)
    navigate('/')
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken')
    api.post('/auth/logout', { refreshToken }).catch(() => {})
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
