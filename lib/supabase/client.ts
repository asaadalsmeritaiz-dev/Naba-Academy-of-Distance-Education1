// ==========================================
// Supabase Client Setup (Client-Side / Browser)
// For Next.js App Router (using @supabase/ssr)
// ==========================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Validates and retrieves Supabase credentials from the environment.
 */
function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

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
