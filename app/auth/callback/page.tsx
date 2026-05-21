'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setSessionCookies } from '@/features/auth/lib/supabase-auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    
    if (code) {
      // The API route will handle the session exchange and cookie setting
      // This page is just a fallback in case JavaScript is enabled
      window.location.href = `/api/auth/callback?code=${code}`
    } else {
      // No code, redirect to login
      router.push('/login')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Completing authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your sign-in.
        </p>
      </div>
    </div>
  )
}
