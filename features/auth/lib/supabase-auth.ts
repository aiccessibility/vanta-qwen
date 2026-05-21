import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { AuthUser, Session } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (for browser)
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client with service role key (for admin operations)
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Server-side Supabase client for RSC (uses cookies)
export const createClientForRSC = async () => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  if (refreshToken && accessToken) {
    // Set the session from cookies
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  return client
}

// Get current user from server component
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const client = await createClientForRSC()
    const { data: { user }, error } = await client.auth.getUser()

    if (error || !user) {
      return null
    }

    // Fetch additional user metadata from profiles table
    const { data: profile } = await client
      .from('profiles')
      .select('*, organization_members(role, organization_id)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return null
    }

    const orgMember = profile.organization_members?.[0]

    return {
      id: user.id,
      email: user.email!,
      name: profile.name || user.user_metadata?.name || '',
      role: orgMember?.role || 'member',
      organization_id: orgMember?.organization_id,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get session from server component
export const getSession = async (): Promise<Session | null> => {
  try {
    const client = await createClientForRSC()
    const { data: { session }, error } = await client.auth.getSession()

    if (error || !session) {
      return null
    }

    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    return {
      user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Sign up with email and password
export const signUp = async (email: string, password: string, name: string) => {
  const client = createBrowserClient()
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const client = createBrowserClient()
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // Set cookies for server-side authentication
  await setSessionCookies(data.session)

  return data
}

// Sign out
export const signOut = async () => {
  const client = createBrowserClient()
  
  const { error } = await client.auth.signOut()
  
  if (error) {
    throw error
  }

  // Clear cookies
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
}

// Set session cookies
export const setSessionCookies = async (session: any) => {
  const cookieStore = await cookies()
  
  cookieStore.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in,
  })

  cookieStore.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

// Refresh session
export const refreshSession = async () => {
  const client = createBrowserClient()
  
  const { data, error } = await client.auth.refreshSession()

  if (error) {
    throw error
  }

  await setSessionCookies(data.session)

  return data
}
