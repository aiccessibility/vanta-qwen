'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn as supabaseSignIn } from '@/features/auth/lib/supabase-auth'
import { LoginFormData, loginSchema } from '@/lib/validators/auth'

interface UseLoginReturn {
  isLoading: boolean
  error: string | null
  login: (data: LoginFormData) => Promise<void>
  resetError: () => void
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const login = useCallback(async (data: LoginFormData) => {
    try {
      setError(null)
      setIsLoading(true)

      // Validate input
      const validatedData = loginSchema.parse(data)

      // Sign in with Supabase
      await supabaseSignIn(validatedData.email, validatedData.password)

      // Redirect to dashboard on success
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    login,
    resetError,
  }
}
