/**
 * Doubt Solver Chat Route
 *
 * POST /api/chat/doubt
 * - Accepts a question + optional topicId + optional conversation history
 * - Fetches user's active roadmap context and topic context
 * - Calls answerDoubt() from the AI provider
 * - Saves the exchange to chat_history with context_snapshot
 * - Returns the AI answer
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { answerDoubt } from "@/lib/ai/provider";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const DoubtBodySchema = z.object({
  question: z.string().min(1, "Question is required").max(2000),
  topic_id: z.string().uuid().optional(),
  /** Last N messages in the conversation for continuity */
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .default([]),
});

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DoubtBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { question, topic_id, history } = parsed.data;

  // 3. Fetch user profile + active roadmap for context
  const { data: userProfile } = await supabase
    .from("users")
    .select("goal, level, primary_objective")
    .eq("id", user.id)
    .single();

  const { data: activeRoadmap } = await supabase
    .from("roadmaps")
    .select("title, estimated_total_time")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  // Build roadmap context string
  const roadmapContext = activeRoadmap
    ? `Roadmap: "${activeRoadmap.title}" (${activeRoadmap.estimated_total_time ?? "unknown duration"}). Student goal: ${userProfile?.goal ?? "not set"}. Level: ${userProfile?.level ?? "unknown"}.`
    : `Student goal: ${userProfile?.goal ?? "not set"}. Level: ${userProfile?.level ?? "unknown"}.`;

  // 4. Fetch topic context (if topicId provided)
  let topicContext = "";
  let topicRow: { id: string; title: string; learning_outcome: string | null } | null = null;

  if (topic_id) {
    const { data } = await supabase
      .from("topics")
      .select("id, title, learning_outcome, difficulty, estimated_time")
      .eq("id", topic_id)
      .single();

    if (data) {
      topicRow = data;
      topicContext = `Current topic: "${data.title}". Difficulty: ${data.difficulty ?? "unknown"}. Learning outcome: ${data.learning_outcome ?? "not set"}. Estimated time: ${data.estimated_time ?? "unknown"}.`;
    }
  }

  // 5. Call AI doubt solver
  let answer: string;
  try {
    answer = await answerDoubt({
      userId: user.id,
      question,
      roadmapContext,
      topicContext,
      chatHistory: history,
    });
  } catch (err) {
    console.error("[chat/doubt] AI call failed:", err);
    return NextResponse.json(
      { error: "Failed to generate answer. Please try again." },
      { status: 500 }
    );
  }

  // 6. Save exchange to chat_history with context_snapshot for debugging
  const contextSnapshot = {
    roadmap: activeRoadmap ?? null,
    topic: topicRow ?? null,
    user_level: userProfile?.level ?? null,
    history_length: history.length,
  };

  await supabaseAdmin.from("chat_history").insert({
    user_id: user.id,
    topic_id: topic_id ?? null,
    question,
    answer,
    context_snapshot: contextSnapshot,
  });

  return NextResponse.json({ answer });
}
