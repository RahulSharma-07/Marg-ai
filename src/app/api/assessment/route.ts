/**
 * Assessment API Route
 *
 * POST /api/assessment
 * - Accepts the student's onboarding assessment answers
 * - Saves raw answers to assessments table
 * - Updates users table with profile fields
 * - Creates a roadmap row with status='generating'
 * - Generates the roadmap inline (async) then updates the roadmap to 'active'
 * - Returns the created roadmap id so the client can poll for completion
 */

export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRoadmap, curateResources } from "@/lib/ai/provider";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Input validation schema
// ---------------------------------------------------------------------------

const AssessmentBodySchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  study_hours_per_day: z.enum(["0.5", "1", "2", "4+"]),
  learning_style: z.enum(["videos", "reading", "interactive", "mixed"]),
  primary_objective: z.enum([
    "placement",
    "internship",
    "freelancing",
    "projects",
    "higher_studies",
  ]),
});

export async function POST(request: Request) {
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

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AssessmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const answers = parsed.data;

  try {
    // 3. Save raw assessment answers
    await supabaseAdmin.from("assessments").insert({
      user_id: user.id,
      raw_answers: answers,
    });

    // 4. Update user profile fields
    await supabaseAdmin
      .from("users")
      .update({
        goal: answers.goal,
        level: answers.level,
        study_hours_per_day: answers.study_hours_per_day,
        learning_style: answers.learning_style,
        primary_objective: answers.primary_objective,
      })
      .eq("id", user.id);

    // 5. Archive any existing active roadmap for this user
    await supabaseAdmin
      .from("roadmaps")
      .update({ status: "archived" })
      .eq("user_id", user.id)
      .eq("status", "active");

    // 6. Create a placeholder roadmap row with status='generating'
    const { data: roadmapRow, error: roadmapInsertError } = await supabaseAdmin
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: `${answers.goal} Roadmap`,
        status: "generating",
      })
      .select()
      .single();

    if (roadmapInsertError || !roadmapRow) {
      throw new Error(
        roadmapInsertError?.message ?? "Failed to create roadmap row"
      );
    }

    const roadmapId: string = roadmapRow.id;

    // 7. Generate roadmap via AI (inline — marks generating → active on completion)
    //    Run this without awaiting in a try/catch so errors update the roadmap
    //    status to 'archived' (failed) rather than leaving it stuck at 'generating'.
    (async () => {
      try {
        const aiRoadmap = await generateRoadmap({
          userId: user.id,
          goal: answers.goal,
          level: answers.level,
          studyHoursPerDay: answers.study_hours_per_day,
          learningStyle: answers.learning_style,
          primaryObjective: answers.primary_objective,
        });

        // 8. Update roadmap title and estimated time
        await supabaseAdmin
          .from("roadmaps")
          .update({
            title: aiRoadmap.title,
            estimated_total_time: aiRoadmap.estimated_total_time,
            status: "active",
          })
          .eq("id", roadmapId);

        // 9. Insert all topics
        const topicRows = aiRoadmap.topics.map((t) => ({
          roadmap_id: roadmapId,
          title: t.title,
          sequence_order: t.sequence_order,
          difficulty: t.difficulty,
          estimated_time: t.estimated_time,
          prerequisites: t.prerequisites,
          learning_outcome: t.learning_outcome,
          week_number: t.week_number,
          // First topic is available; the rest are locked until unlocked
          status: t.sequence_order === 1 ? "available" : "locked",
        }));

        const { data: insertedTopics, error: topicsError } =
          await supabaseAdmin.from("topics").insert(topicRows).select("id");

        if (topicsError) {
          throw new Error(topicsError.message);
        }

        // 10. Curate resources for the first topic immediately
        if (insertedTopics && insertedTopics.length > 0) {
          try {
            const firstTopicId = insertedTopics[0].id;
            const resources = await curateResources(
              user.id,
              aiRoadmap.topics[0].title,
              answers.level
            );
            await supabaseAdmin.from("resources").insert(
              resources.map((r) => ({
                topic_id: firstTopicId,
                ...r,
              }))
            );
          } catch (resourceErr) {
            console.error(
              "[assessment] Resource curation failed for first topic:",
              resourceErr
            );
            // Non-fatal — topic is still usable without resources
          }
        }

        // 11. Create progress tracking row
        await supabaseAdmin.from("progress").upsert(
          {
            user_id: user.id,
            roadmap_id: roadmapId,
            topics_completed: 0,
            total_topics: aiRoadmap.topics.length,
            last_activity_at: new Date().toISOString(),
          },
          { onConflict: "user_id,roadmap_id" }
        );
      } catch (genError) {
        console.error("[assessment] Roadmap generation failed:", genError);
        // Mark the roadmap as archived (failed) so UI can show an error
        await supabaseAdmin
          .from("roadmaps")
          .update({ status: "archived" })
          .eq("id", roadmapId);
      }
    })();

    // 12. Return immediately with the roadmap id — client polls for status
    return NextResponse.json({ roadmap_id: roadmapId }, { status: 201 });
  } catch (err) {
    console.error("[assessment] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
