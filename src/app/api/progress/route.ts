/**
 * Progress Route
 *
 * GET /api/progress
 * - Returns the authenticated user's progress for their active roadmap
 * - Includes roadmap title, completion percentage, topics breakdown
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Find the user's active roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("id, title, estimated_total_time, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (roadmapError || !roadmap) {
    // No active roadmap is not an error state — just no data
    return NextResponse.json({ progress: null, roadmap: null });
  }

  // 3. Fetch progress row for the active roadmap
  const { data: progress, error: progressError } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("roadmap_id", roadmap.id)
    .single();

  if (progressError) {
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }

  // 4. Compute derived fields
  const completionPct =
    progress && progress.total_topics > 0
      ? Math.round((progress.topics_completed / progress.total_topics) * 100)
      : 0;

  return NextResponse.json({
    roadmap,
    progress: progress
      ? {
          ...progress,
          completion_percentage: completionPct,
        }
      : null,
  });
}
