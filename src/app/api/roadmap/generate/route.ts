/**
 * Roadmap Generate Route
 *
 * POST /api/roadmap/generate
 * - Validates user auth and existing profile
 * - Calls generateRoadmap() from the AI provider
 * - Validates response with Zod RoadmapSchema
 * - Inserts roadmap + topics into DB
 * - Returns the created roadmap with topics
 *
 * This route is primarily useful for re-generating a roadmap
 * without going through the full assessment flow again.
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/ai/provider";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  // 1. Authenticate the user
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

  // 2. Fetch user profile — we need assessment answers to generate the roadmap
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("goal, level, study_hours_per_day, learning_style, primary_objective")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "User profile not found. Please complete the assessment first." },
      { status: 404 }
    );
  }

  if (!profile.goal || !profile.level) {
    return NextResponse.json(
      { error: "Profile is incomplete. Please complete the assessment first." },
      { status: 400 }
    );
  }

  try {
    // 3. Archive any existing active roadmap
    await supabaseAdmin
      .from("roadmaps")
      .update({ status: "archived" })
      .eq("user_id", user.id)
      .eq("status", "active");

    // 4. Generate roadmap via AI
    const aiRoadmap = await generateRoadmap({
      userId: user.id,
      goal: profile.goal,
      level: profile.level,
      studyHoursPerDay: profile.study_hours_per_day ?? "1",
      learningStyle: profile.learning_style ?? "mixed",
      primaryObjective: profile.primary_objective ?? "projects",
    });

    // 5. Insert roadmap row
    const { data: roadmapRow, error: roadmapInsertError } = await supabaseAdmin
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: aiRoadmap.title,
        estimated_total_time: aiRoadmap.estimated_total_time,
        status: "active",
      })
      .select()
      .single();

    if (roadmapInsertError || !roadmapRow) {
      throw new Error(
        roadmapInsertError?.message ?? "Failed to insert roadmap"
      );
    }

    // 6. Insert all topics
    const topicRows = aiRoadmap.topics.map((t) => ({
      roadmap_id: roadmapRow.id,
      title: t.title,
      sequence_order: t.sequence_order,
      difficulty: t.difficulty,
      estimated_time: t.estimated_time,
      prerequisites: t.prerequisites,
      learning_outcome: t.learning_outcome,
      week_number: t.week_number,
      status: t.sequence_order === 1 ? "available" : "locked",
    }));

    const { data: topics, error: topicsError } = await supabaseAdmin
      .from("topics")
      .insert(topicRows)
      .select();

    if (topicsError) {
      throw new Error(topicsError.message);
    }

    // 7. Create / reset progress row
    await supabaseAdmin.from("progress").upsert(
      {
        user_id: user.id,
        roadmap_id: roadmapRow.id,
        topics_completed: 0,
        total_topics: aiRoadmap.topics.length,
        last_activity_at: new Date().toISOString(),
      },
      { onConflict: "user_id,roadmap_id" }
    );

    return NextResponse.json(
      { roadmap: { ...roadmapRow, topics } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[roadmap/generate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Roadmap generation failed" },
      { status: 500 }
    );
  }
}
