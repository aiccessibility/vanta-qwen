import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/transactions',
  '/taxes',
  '/documents',
  '/assistant',
  '/settings',
  '/onboarding',
]

// Public routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get session from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  // Check if user has a valid session
  let isAuthenticated = false
  let userRole: string | null = null

  if (accessToken && refreshToken) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Verify the session
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (!error && user) {
        isAuthenticated = true
        
        // Fetch user role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_members(role)')
          .eq('id', user.id)
          .single()
        
        userRole = profile?.organization_members?.[0]?.role || 'member'
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      isAuthenticated = false
    }
  }

  // Protect authenticated routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Role-based access control for specific routes
    if (pathname.startsWith('/settings') && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
