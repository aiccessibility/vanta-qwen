'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signUp as supabaseSignUp } from '@/features/auth/lib/supabase-auth'
import { SignupFormData, signupSchema } from '@/lib/validators/auth'

interface UseSignupReturn {
  isLoading: boolean
  error: string | null
  signup: (data: SignupFormData) => Promise<void>
  resetError: () => void
}

export function useSignup(): UseSignupReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const signup = useCallback(async (data: SignupFormData) => {
    try {
      setError(null)
      setIsLoading(true)

      // Validate input
      const validatedData = signupSchema.parse(data)

      // Sign up with Supabase
      await supabaseSignUp(validatedData.email, validatedData.password, validatedData.name)

      // Redirect to login or onboarding on success
      router.push('/onboarding')
      router.refresh()
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
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
    signup,
    resetError,
  }
}
