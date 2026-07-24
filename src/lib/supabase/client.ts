// ==========================================
// Supabase Client Setup (Client-Side / Browser)
// For Next.js App Router & Vite (using @supabase/ssr)
// ==========================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Validates and retrieves Supabase credentials from the environment.
 */
function getSupabaseCredentials() {
  // Try Vite-specific env variables first, then fallback to Next.js or generic process.env
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const supabaseUrl = 
    metaEnv?.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL ||
    'https://placeholder.supabase.co';

  const supabaseAnonKey = 
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY ||
    'placeholder-key';

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Creates a browser-compatible Supabase client.
 * Safe for use in Client Components.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
