/**
 * Roadmap Detail Route
 *
 * GET /api/roadmap/[id]
 * - Returns a roadmap with its topics and current progress
 * - Enforces ownership via RLS (user can only fetch their own roadmaps)
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized — please log in" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // 2. Fetch roadmap (RLS ensures the user can only see their own)
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .single();

  if (roadmapError || !roadmap) {
    return NextResponse.json(
      { error: "Roadmap not found" },
      { status: 404 }
    );
  }

  // 3. Fetch topics ordered by sequence
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .eq("roadmap_id", id)
    .order("sequence_order", { ascending: true });

  if (topicsError) {
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }

  // 4. Fetch progress summary
  const { data: progress } = await supabase
    .from("progress")
    .select("*")
    .eq("roadmap_id", id)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    roadmap: {
      ...roadmap,
      topics: topics ?? [],
    },
    progress: progress ?? null,
  });
}
