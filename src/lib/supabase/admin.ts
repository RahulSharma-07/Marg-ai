/**
 * Supabase Admin Client
 *
 * Uses the SERVICE ROLE key — bypasses RLS entirely.
 * ONLY import this file from:
 *   - Background job handlers
 *   - Internal server-side utilities that need cross-user access
 *
 * NEVER import from client components, "use client" files, or
 * any route handler that responds directly to user requests.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;



function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing env var: SUPABASE_SERVICE_ROLE_KEY — required for admin client. " +
        "Add it to .env.local (get it from Supabase Dashboard → Project Settings → API)."
    );
  }

  _adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

/**
 * Service-role Supabase client proxy.
 * Accessing any property triggers lazy initialisation.
 * Bypasses RLS — use only in server/job contexts.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
