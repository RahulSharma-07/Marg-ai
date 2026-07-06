/**
 * Auth Callback Route
 *
 * Handles the OAuth redirect from Supabase (Google OAuth, Magic Link, etc.).
 * Exchanges the `code` parameter for a user session and redirects to the app.
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to redirect after successful login (defaults to dashboard)
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the intended destination after successful OAuth
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl.toString());
    }

    console.error("[auth/callback] Code exchange failed:", error.message);
  }

  // Something went wrong — redirect to login with an error hint
  const errorUrl = new URL("/login?error=auth_callback_failed", origin);
  return NextResponse.redirect(errorUrl.toString());
}
