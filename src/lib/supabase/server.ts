// ==========================================
// Supabase Server Client Setup (Server-Side)
// For Express / Vite server routes
// ==========================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function normalizeEnvValue(value?: string) {
  return value ? value.trim() : '';
}

function isPlaceholder(value: string) {
  return !value || /your-supabase|placeholder|mock/i.test(value);
}

function getSupabaseCredentials() {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const supabaseUrl = normalizeEnvValue(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv?.VITE_SUPABASE_URL
  );
  const supabaseAnonKey = normalizeEnvValue(
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv?.VITE_SUPABASE_ANON_KEY
  );
  const supabaseServiceRoleKey = normalizeEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SECRET_KEY
  );

  const isConfigured = Boolean(
    supabaseUrl &&
    !isPlaceholder(supabaseUrl) &&
    ((supabaseAnonKey && !isPlaceholder(supabaseAnonKey)) || (supabaseServiceRoleKey && !isPlaceholder(supabaseServiceRoleKey)))
  );

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, isConfigured };
}

export function getSupabaseConnectionInfo() {
  const { supabaseUrl, isConfigured, supabaseServiceRoleKey } = getSupabaseCredentials();
  return {
    configured: isConfigured,
    url: supabaseUrl || null,
    serviceRoleConfigured: Boolean(supabaseServiceRoleKey && !isPlaceholder(supabaseServiceRoleKey)),
  };
}

/**
 * Creates a server-compatible Supabase client for Express routes.
 * Prefer the service-role key when available so RLS can be bypassed.
 */
export async function createClient(req?: any) {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return new Proxy({}, {
      get() {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.');
      }
    }) as any;
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
