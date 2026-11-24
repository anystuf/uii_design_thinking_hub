import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createBoundedAuthFetch } from './auth-timeout';

import { clearWorkspaceProfile } from './authenticated-api';

let cached: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  cached = createClient(url, key, {
    global: { fetch: createBoundedAuthFetch(url) },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  cached.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') clearWorkspaceProfile(); });
  return cached;
}
