'use client'

import { useState, useCallback } from 'react'
import { signOut as supabaseSignOut } from '@/features/auth/lib/supabase-auth'

interface UseLogoutReturn {
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
  resetError: () => void
}

export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      // Sign out with Supabase
      await supabaseSignOut()

      // Reload the page to clear all state
      window.location.href = '/login'
    } catch (err: any) {
      console.error('Logout error:', err)
      setError(err.message || 'Failed to sign out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    logout,
    resetError,
  }
}
