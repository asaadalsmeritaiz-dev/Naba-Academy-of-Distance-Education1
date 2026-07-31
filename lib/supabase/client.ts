// ==========================================
// Supabase Client Setup (Client-Side / Browser)
// For Vite / Express frontends (using @supabase/ssr)
// ==========================================

import { createBrowserClient } from '@supabase/ssr';

function normalizeEnvValue(value?: string) {
  return value ? value.trim() : '';
}

function isPlaceholder(value: string) {
  return !value || /your-supabase|placeholder|mock/i.test(value);
}

/**
 * Validates and retrieves Supabase credentials from the environment.
 */
function getSupabaseCredentials() {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const supabaseUrl = normalizeEnvValue(
    metaEnv?.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL
  );
  const supabaseAnonKey = normalizeEnvValue(
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey));

  return { supabaseUrl, supabaseAnonKey, isConfigured };
}

export function getSupabaseConnectionInfo() {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseCredentials();
  return {
    configured: isConfigured,
    url: supabaseUrl || null,
    anonKeyConfigured: Boolean(supabaseAnonKey && !isPlaceholder(supabaseAnonKey)),
  };
}

/**
 * Creates a browser-compatible Supabase client.
 * Safe for use in Client Components.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    console.warn('[Supabase] Browser client is disabled until SUPABASE_URL and SUPABASE_ANON_KEY are configured.');
    return null as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
