import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client. Uses the service-role key and must never be
 * imported from client components. RLS is enabled on all tables and denies
 * anon access; privileged access happens only here, on the server.
 *
 * `ws` is provided as the realtime transport because Node.js < 22 has no
 * native WebSocket (the client constructs a RealtimeClient eagerly even
 * though this app never subscribes to realtime channels).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase server credentials missing. Add SUPABASE_SERVICE_ROLE_KEY to .env (Supabase Dashboard → Settings → API keys).",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket as unknown as never },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  );
}
