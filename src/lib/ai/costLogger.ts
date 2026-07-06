/**
 * AI Usage Logger
 *
 * Logs every Gemini (or other provider) call to the ai_usage_logs table.
 * This is the early-warning system for unit economics — call this from
 * every function in provider.ts.
 *
 * Uses the admin client so logging succeeds even for service-role contexts.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AICallType =
  | "roadmap_gen"
  | "mindmap_gen"
  | "summary_gen"
  | "doubt_solver"
  | "resource_curation";

/**
 * Insert one row into ai_usage_logs.
 *
 * @param userId           - Supabase auth user id
 * @param callType         - Which AI feature triggered this call
 * @param provider         - Model name, e.g. "gemini-2.5-flash"
 * @param tokensUsed       - Total tokens (input + output)
 * @param estimatedCostUsd - Calculated cost at the time of the call
 */
export async function logAIUsage(
  userId: string,
  callType: AICallType,
  provider: string,
  tokensUsed: number,
  estimatedCostUsd: number
): Promise<void> {
  const { error } = await supabaseAdmin.from("ai_usage_logs").insert({
    user_id: userId,
    call_type: callType,
    provider,
    tokens_used: tokensUsed,
    estimated_cost_usd: estimatedCostUsd,
  });

  if (error) {
    // Non-fatal — log to console but don't throw, so a logging failure
    // never breaks the user-facing response.
    console.error("[costLogger] Failed to log AI usage:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Cost estimation helpers
// Prices are approximate and should be updated as Gemini pricing changes.
// https://ai.google.dev/pricing
// ---------------------------------------------------------------------------

const GEMINI_FLASH_COST_PER_1K_TOKENS_USD = 0.000075; // gemini-2.5-flash (blended est.)

/**
 * Estimate cost in USD for a Gemini Flash call given total token count.
 */
export function estimateGeminiFlashCost(totalTokens: number): number {
  return (totalTokens / 1000) * GEMINI_FLASH_COST_PER_1K_TOKENS_USD;
}
