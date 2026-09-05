import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import type { CurrentUser } from '../types'

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  unreadCount: number
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (payload: { name: string; username: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  setUnreadCount: (n: number) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The first request also establishes the CSRF cookie for the session.
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login({ email, password })
    await refresh()
  }, [refresh])

  const register = useCallback(async (payload: { name: string; username: string; email: string; password: string }) => {
    await authApi.register(payload)
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setUnreadCount(0)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, unreadCount, refresh, login, register, logout, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (! ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
