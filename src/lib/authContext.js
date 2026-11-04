'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = localToken ? { 'Authorization': `Bearer ${localToken}` } : {}

      const response = await fetch('/api/auth/verify', {
        headers,
        credentials: 'same-origin'
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        if (typeof window !== 'undefined' && data.token) {
          localStorage.setItem('token', data.token)
        }
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.message }
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        if (typeof window !== 'undefined' && data.token) {
          localStorage.setItem('token', data.token)
        }
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.message }
      }
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
