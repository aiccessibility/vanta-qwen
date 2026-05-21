import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

/**
 * Client-side Supabase client
 */
export const createBrowserClient = () => {
  return createClient<Database>(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
};

/**
 * Server-side Supabase client with service role
 * Use only in server components and API routes
 */
export const createServerClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};

/**
 * Create a Supabase client with user token
 * For server-side operations on behalf of a user
 */
export const createUserClient = (token: string) => {
  const client = createBrowserClient();
  
  // Set the auth token for this client
  client.setAuth(token);
  
  return client;
};

// Singleton instances for server-side usage
let serverClient: ReturnType<typeof createServerClient> | null = null;

export const getServerClient = () => {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
};

// Legacy export for backwards compatibility
export const supabase = createBrowserClient();
