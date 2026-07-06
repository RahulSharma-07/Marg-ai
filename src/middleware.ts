import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Protected routes that require authentication
const protectedRoutes = [
  "/", // Main chat page
  "/profile",
  "/history",
  "/uploads",
  "/workspace",
];

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/signup",
  "/auth/callback",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    const { supabase, supabaseResponse } = createClient(request);
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If not authenticated, redirect to login with the intended destination
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
