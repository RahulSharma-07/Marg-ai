/**
 * Topic Detail Route
 *
 * GET  /api/topics/[id] — returns topic with its resources
 * PATCH /api/topics/[id] — updates topic status
 *
 * On PATCH to status='completed':
 *   - Sets completed_at timestamp
 *   - Triggers summary + mindmap generation inline
 *   - Unlocks the next topic in sequence
 *   - Curates resources for the next topic
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSummary, generateMindmap, curateResources } from "@/lib/ai/provider";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Valid status transitions
const PatchBodySchema = z.object({
  status: z.enum(["available", "in_progress", "completed"]),
});

// ---------------------------------------------------------------------------
// GET — fetch topic with resources
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch topic (RLS ensures ownership via roadmap → user chain)
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .single();

  if (topicError || !topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // Fetch resources for this topic
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("topic_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ topic: { ...topic, resources: resources ?? [] } });
}

// ---------------------------------------------------------------------------
// PATCH — update topic status
// ---------------------------------------------------------------------------

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Fetch the current topic to validate ownership and get context
  const { data: topic, error: fetchError } = await supabase
    .from("topics")
    .select("*, roadmaps!inner(user_id)")
    .eq("id", id)
    .single();

  if (fetchError || !topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  // Apply status update
  const { data: updatedTopic, error: updateError } = await supabaseAdmin
    .from("topics")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updatedTopic) {
    return NextResponse.json(
      { error: updateError?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  // If completing, trigger async side effects
  if (status === "completed") {
    (async () => {
      try {
        // Generate summary and mindmap
        const [summary, mindmap] = await Promise.all([
          generateSummary(user.id, topic.title, topic.learning_outcome ?? undefined),
          generateMindmap(user.id, topic.title),
        ]);

        await supabaseAdmin
          .from("topics")
          .update({ summary, mindmap })
          .eq("id", id);

        // Unlock next topic in sequence
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

        // Update progress counter
        await supabaseAdmin.rpc("increment_topics_completed", {
          p_user_id: user.id,
          p_roadmap_id: topic.roadmap_id,
        });
      } catch (err) {
        console.error("[topics/PATCH] Side-effect error:", err);
      }
    })();
  }

  return NextResponse.json({ topic: updatedTopic });
}
