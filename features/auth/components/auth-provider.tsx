'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser } from '@/types'
import { getCurrentUser } from '@/features/auth/lib/supabase-auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  initialUser?: AuthUser | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser || null)
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    // Only fetch user if not provided initially
    if (!initialUser) {
      loadUser()
    }
  }, [])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    setIsLoading(true)
    await loadUser()
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
