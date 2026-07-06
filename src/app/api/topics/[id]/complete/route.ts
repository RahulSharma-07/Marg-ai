/**
 * Topic Complete Route
 *
 * POST /api/topics/[id]/complete
 * - Marks the topic as completed with timestamp
 * - Updates the progress table (increment topics_completed)
 * - Generates summary and mindmap for the completed topic
 * - Unlocks the next topic and curates its resources
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateSummary, generateMindmap, curateResources } from "@/lib/ai/provider";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 2. Fetch topic (RLS via supabase client ensures ownership)
  const { data: topic, error: fetchError } = await supabase
    .from("topics")
    .select("id, title, sequence_order, roadmap_id, status, learning_outcome")
    .eq("id", id)
    .single();

  if (fetchError || !topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  if (topic.status === "completed") {
    return NextResponse.json(
      { error: "Topic is already completed" },
      { status: 409 }
    );
  }

  const completedAt = new Date().toISOString();

  // 3. Mark topic as completed
  const { error: updateError } = await supabaseAdmin
    .from("topics")
    .update({ status: "completed", completed_at: completedAt })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // 4. Update progress last_activity and topics_completed
  await supabaseAdmin
    .from("progress")
    .update({
      last_activity_at: completedAt,
      updated_at: completedAt,
    })
    .eq("user_id", user.id)
    .eq("roadmap_id", topic.roadmap_id);

  // Increment topics_completed manually (avoid needing a stored procedure)
  const { data: progressRow } = await supabaseAdmin
    .from("progress")
    .select("topics_completed")
    .eq("user_id", user.id)
    .eq("roadmap_id", topic.roadmap_id)
    .single();

  if (progressRow) {
    await supabaseAdmin
      .from("progress")
      .update({ topics_completed: progressRow.topics_completed + 1 })
      .eq("user_id", user.id)
      .eq("roadmap_id", topic.roadmap_id);
  }

  // 5. Run AI side effects asynchronously — don't block the response
  (async () => {
    try {
      // Generate summary and mindmap in parallel
      const [summary, mindmap] = await Promise.all([
        generateSummary(user.id, topic.title, topic.learning_outcome ?? undefined),
        generateMindmap(user.id, topic.title),
      ]);

      await supabaseAdmin
        .from("topics")
        .update({ summary, mindmap })
        .eq("id", id);

      // Unlock next topic
      const { data: nextTopic } = await supabaseAdmin
        .from("topics")
        .select("id, title")
        .eq("roadmap_id", topic.roadmap_id)
        .eq("sequence_order", topic.sequence_order + 1)
        .single();

      if (nextTopic) {
        await supabaseAdmin
          .from("topics")
          .update({ status: "available" })
          .eq("id", nextTopic.id);

        // Curate resources for the newly unlocked topic
        const { data: userProfile } = await supabaseAdmin
          .from("users")
          .select("level")
          .eq("id", user.id)
          .single();

        const resources = await curateResources(
          user.id,
          nextTopic.title,
          userProfile?.level ?? "beginner"
        );

        await supabaseAdmin.from("resources").insert(
          resources.map((r) => ({ topic_id: nextTopic.id, ...r }))
        );
      }
    } catch (err) {
      console.error("[topics/complete] AI side-effects failed:", err);
    }
  })();

  // 6. Return immediately — AI work is happening in the background
  return NextResponse.json({
    message: "Topic marked as completed. Summary and mindmap are being generated.",
    topic_id: id,
    completed_at: completedAt,
  });
}
