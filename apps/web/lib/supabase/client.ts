import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Supabase client factory.
 *
 * Infrastructure only. There is no authentication, no schema, no row-level security and
 * no cloud sync yet — this exists so those can be added without restructuring the app.
 *
 * Two rules this file exists to enforce:
 *
 * 1. Reactively must run with no credentials. `getSupabaseClient()` returns `null` when
 *    unconfigured; callers branch on it rather than crashing at import time.
 * 2. Only the anon key is ever used here. It is public by design and protected by RLS.
 *    A service-role key must never be read from client-reachable code.
 */

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  client ??= createClient(
    // Verified non-null by isSupabaseConfigured().
    publicEnv.NEXT_PUBLIC_SUPABASE_URL as string,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: {
        // Auth is not implemented yet; do not have the SDK manage sessions or parse
        // callback URLs behind our back.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return client;
}

export { isSupabaseConfigured };
