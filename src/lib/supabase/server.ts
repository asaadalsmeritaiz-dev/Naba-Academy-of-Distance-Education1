// ==========================================
// Supabase Server Client Setup (Server-Side)
// For Next.js App Router & Server Environments (using @supabase/ssr)
// ==========================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Validates and retrieves Supabase credentials from the environment.
 */
function getSupabaseCredentials() {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv?.VITE_SUPABASE_URL ||
    'https://placeholder.supabase.co';

  const supabaseAnonKey = 
    process.env.SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    'placeholder-key';

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Creates a server-compatible Supabase client for Route Handlers,
 * Server Actions, or Server Components.
 */
export async function createClient(req?: any) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();
  
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    // Fallback for Express / non-Next.js environments
    const authHeader = req?.headers?.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    
    const options: any = {};
    if (token) {
      options.global = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    }
    
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        ...options,
        cookies: {
          getAll() {
            return [];
          },
          setAll() {}
        }
      }
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be safely ignored if middleware handles dynamic session updates.
          }
        },
      },
    }
  );
}
