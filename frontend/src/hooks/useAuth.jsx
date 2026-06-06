import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillswap_user')) } catch { return null }
  })
  const [token, setToken]   = useState(() => localStorage.getItem('skillswap_token'))
  const [loading, setLoading] = useState(false)

  // Rehydrate on mount
  useEffect(() => {
    if (token && !user) {
      authApi.me()
        .then(r => setUser(r.data.data))
        .catch(() => { setToken(null); localStorage.removeItem('skillswap_token') })
    }
  }, [token])

  const persist = (u, t) => {
    setUser(u); setToken(t)
    localStorage.setItem('skillswap_user', JSON.stringify(u))
    localStorage.setItem('skillswap_token', t)
  }

  const register = useCallback(async (data) => {
    setLoading(true)
    try {
      const res = await authApi.register(data)
      const { user: u, token: t } = res.data.data
      persist(u, t)
      return { success: true }
    } catch (err) {
      return { success: false, errors: err.response?.data?.errors || {} }
    } finally { setLoading(false) }
  }, [])

  const login = useCallback(async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { user: u, token: t } = res.data.data
      persist(u, t)
      return { success: true }
    } catch (err) {
      return { success: false, errors: err.response?.data?.errors || {} }
    } finally { setLoading(false) }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    setUser(null); setToken(null)
    localStorage.removeItem('skillswap_user')
    localStorage.removeItem('skillswap_token')
  }, [])

  const refreshUser = useCallback(async () => {
    const res = await authApi.me()
    const u = res.data.data
    setUser(u)
    localStorage.setItem('skillswap_user', JSON.stringify(u))
    return u
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
